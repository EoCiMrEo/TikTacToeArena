from flask import Blueprint, request, jsonify, make_response, current_app
from extensions import supabase, db
from db.models.user import User
from flask_jwt_extended import (
    set_access_cookies, set_refresh_cookies, 
    unset_jwt_cookies
)
from supabase_auth.errors import AuthApiError
import requests
import os

auth_bp = Blueprint('auth', __name__)

# Frontend URL for redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4028')

# User Profile Service URL
USER_PROFILE_SERVICE_URL = os.getenv('USER_PROFILE_SERVICE_URL', 'http://localhost:5000')
INTERNAL_API_KEY = os.getenv('INTERNAL_API_KEY', 'dev_internal_key')

def create_user_profile(user_id, email, username=None, full_name=None):
    """Call user profile service to create profile for new user."""
    try:
        response = requests.post(
            f"{USER_PROFILE_SERVICE_URL}/internal/create",
            json={
                "user_id": str(user_id),
                "email": email,
                "username": username,
                "full_name": full_name
            },
            headers={
                "X-Internal-API-Key": INTERNAL_API_KEY,
                "Content-Type": "application/json"
            },
            timeout=5
        )
        if response.status_code in [200, 201]:
            current_app.logger.info(f"Profile created for user {user_id}")
            return True
        else:
            current_app.logger.warning(f"Failed to create profile: {response.text}")
            return False
    except Exception as e:
        current_app.logger.error(f"Error calling user profile service: {e}")
        return False

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    # Do not log raw password
    username = data.get('username')
    
    current_app.logger.info(f"Attempting registration for email: {email}, username: {username}")

    if not email or not password:
        current_app.logger.warning("Registration failed: Missing email or password")
        return jsonify({"message": "Email and password are required"}), 400

    try:
        # 1. Sign up with Supabase
        # We store username in 'data' metadata so Supabase saves it
        # redirects to frontend verify-email page
        email_redirect_to = f"{FRONTEND_URL}/verify-email"
        
        res = supabase.auth.sign_up({
            "email": email, 
            "password": password,
            "options": {
                "email_redirect_to": email_redirect_to,
                "data": {
                    "username": username
                }
            }
        })

        # 2. Sync to Local Database
        if res.user:
            new_user = User(
                id=res.user.id,
                email=res.user.email,
                username=username,
                password=password # Saving password locally as requested
            )
            db.session.add(new_user)
            db.session.commit()
            current_app.logger.info(f"User synced to local DB: {res.user.id}")
            
            # 3. Create user profile in User Profile Service
            create_user_profile(res.user.id, email, username)
        
        # 4. Supabase sends the confirmation email automatically
        current_app.logger.info(f"Registration successful for {email}")
        return jsonify({
            "message": "Registration successful. Please check your email to verify your account.",
            "user_id": res.user.id if res.user else None
        }), 201

    except AuthApiError as e:
        return jsonify({"message": e.message}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    current_app.logger.info(f"Login attempt for {email}")

    try:
        # 1. Log in with Supabase
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        session = res.session
        user = res.user

        # 2. Return success + Set Cookies
        # Note: We are using Supabase's tokens, but we might want to wrap them 
        # or just set them directly. Here we set them as 'access_token_cookie' 
        # compatible with our Flask-JWT-Extended config if we align keys.
        
        response = jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.user_metadata.get('username'),
                "access_token": session.access_token # Expose token for WebSocket
            }
        })
        
        # Manually set cookies since we handle real tokens now, not flask-generated ones
        # But wait, Flask-JWT-Extended checks 'access_token_cookie'. 
        # We can just repurpose the cookie names.
        
        # ACCESS TOKEN
        response.set_cookie(
            'access_token_cookie',
            session.access_token,
            httponly=True,
            secure=False, # Set True in prod
            samesite='Lax',
            max_age=session.expires_in
        )
        
        # REFRESH TOKEN
        response.set_cookie(
            'refresh_token_cookie',
            session.refresh_token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=60*60*24*7 # 7 days
        )
        
        current_app.logger.info(f"Login successful for {email}")
        return response, 200

    except AuthApiError as e:
        current_app.logger.warning(f"Login failed for {email}: {e.message}")
        return jsonify({"message": e.message}), 401
    except Exception as e:
        current_app.logger.error(f"Login error for {email}: {str(e)}")
        print(e)
        return jsonify({"message": "Login failed"}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        supabase.auth.sign_out()
    except:
        pass # Ignore errors on logout
        
    response = jsonify({"message": "Logout successful"})
    # Clear cookies
    response.set_cookie('access_token_cookie', '', expires=0)
    response.set_cookie('refresh_token_cookie', '', expires=0)
    return response, 200

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token_cookie')
    
    if not refresh_token:
        return jsonify({"message": "Missing refresh token"}), 401
        
    try:
        res = supabase.auth.refresh_session(refresh_token)
        session = res.session
        
        response = jsonify({"message": "Token refreshed"})
        
        # Update Access Token Cookie
        response.set_cookie(
            'access_token_cookie',
            session.access_token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=session.expires_in
        )
        
        # Update Refresh Token Cookie (if rotated)
        if session.refresh_token:
             response.set_cookie(
                'refresh_token_cookie',
                session.refresh_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=60*60*24*7
            )
            
        return response, 200
        
    except Exception as e:
        return jsonify({"message": "Invalid refresh token"}), 401

@auth_bp.route('/me', methods=['GET'])
def get_profile():
    # To verify 'me', we should use the access_token sending in the request
    # Since we are using cookies, we grab it from there.
    token = request.cookies.get('access_token_cookie')
    if not token:
        return jsonify({"message": "Unauthorized"}), 401
        
    try:
        res = supabase.auth.get_user(token)
        user = res.user
        
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.user_metadata.get('username'),
                "access_token": token # Return the token read from cookie
            }
        }), 200
    except Exception as e:
        return jsonify({"message": "Invalid token"}), 401

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required"}), 400
        
    try:
        email_redirect_to = f"{FRONTEND_URL}/verify-email"
        current_app.logger.info(f"Resending verification email to {email}")
        
        supabase.auth.resend({
            "type": "signup",
            "email": email,
            "options": {
                "email_redirect_to": email_redirect_to
            }
        })
        
        return jsonify({"message": "Verification email sent"}), 200
    except AuthApiError as e:
        current_app.logger.warning(f"Resend verification failed: {e.message}")
        return jsonify({"message": e.message}), 400
    except Exception as e:
        current_app.logger.error(f"Resend verification error: {str(e)}")
        return jsonify({"message": "Failed to send email"}), 500
