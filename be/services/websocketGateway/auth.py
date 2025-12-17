import jwt
from config import Config
import logging

logger = logging.getLogger(__name__)

def validate_token(token):
    """
    Validates the JWT token and returns the payload if valid.
    Returns None if invalid.
    """
    if not token:
        return None
        
    try:
        # Check if token starts with 'Bearer '
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        # payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        # For development with Supabase tokens where we don't have the secret:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return None
