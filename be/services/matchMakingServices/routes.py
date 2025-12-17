from flask import Blueprint, request, jsonify
from extensions import db
from db.models.queue import MatchQueue

matchmaking_bp = Blueprint('matchmaking', __name__)

@matchmaking_bp.route('/queue/join', methods=['POST'])
def join_queue():
    data = request.json
    user_id = data.get('user_id')
    elo = data.get('elo')

    if not user_id or elo is None:
        return jsonify({'error': 'Missing user_id or elo'}), 400

    # check if user already in queue
    existing = MatchQueue.query.filter_by(user_id=user_id).first()
    if existing:
         existing.elo = elo # Update elo if changed
         existing.joined_at = db.func.now() # Refresh timestamp
    else:
        new_entry = MatchQueue(user_id=user_id, elo=elo)
        db.session.add(new_entry)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Joined queue', 'status': 'queued'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@matchmaking_bp.route('/queue/leave', methods=['POST'])
def leave_queue():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
         return jsonify({'error': 'Missing user_id'}), 400

    entry = MatchQueue.query.filter_by(user_id=user_id).first()
    if entry:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Left queue', 'status': 'removed'}), 200
    
    return jsonify({'message': 'User not in queue'}), 404

@matchmaking_bp.route('/queue/status', methods=['GET'])
def get_status():
    count = MatchQueue.query.count()
    return jsonify({'queue_size': count}), 200
