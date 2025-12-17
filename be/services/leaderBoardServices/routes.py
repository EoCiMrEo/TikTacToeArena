from flask import Blueprint, request, jsonify, current_app
import redis
from config import Config

leaderboard_bp = Blueprint('leaderboard', __name__)

def get_redis():
    return redis.from_url(Config.REDIS_URL)

@leaderboard_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    r = get_redis()
    
    # Get top users (high to low)
    # zrevrange returns list of (member, score) if withscores=True
    raw_data = r.zrevrange('leaderboard_global', offset, offset + limit - 1, withscores=True)
    
    results = []
    rank = offset + 1
    
    for user_id_bytes, score in raw_data:
        user_id = user_id_bytes.decode('utf-8')
        
        # Fetch metadata
        username = r.hget(f"user:{user_id}", "username")
        username = username.decode('utf-8') if username else "Unknown"
        
        results.append({
            "rank": rank,
            "user_id": user_id,
            "username": username,
            "elo": int(score)
        })
        rank += 1
        
    return jsonify(results), 200

@leaderboard_bp.route('/leaderboard/<user_id>', methods=['GET'])
def get_user_rank(user_id):
    r = get_redis()
    
    # Get rank (0-based)
    rank_idx = r.zrevrank('leaderboard_global', user_id)
    score = r.zscore('leaderboard_global', user_id)
    
    if rank_idx is None:
        return jsonify({"message": "User not ranked"}), 404
        
    username = r.hget(f"user:{user_id}", "username")
    username = username.decode('utf-8') if username else "Unknown"

    return jsonify({
        "rank": rank_idx + 1,
        "user_id": user_id,
        "username": username,
        "elo": int(score)
    }), 200
