from flask import Blueprint, jsonify, request, current_app
from sync_manager import SyncManager
import logging

admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

@admin_bp.route('/sync', methods=['POST'])
def trigger_sync():
    """Admin endpoint to force full reconciliation."""
    api_key = request.headers.get('X-Internal-API-Key')
    expected_key = current_app.config.get('INTERNAL_API_KEY', 'dev_internal_key')
    
    if api_key != expected_key:
        return jsonify({"message": "Unauthorized"}), 401

    try:
        manager = SyncManager() # relying on Env Vars for DB connection
        result = manager.reconcile_all_users()
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Sync trigger failed: {e}")
        return jsonify({"message": str(e)}), 500

@admin_bp.route('/retry-dlq', methods=['POST'])
def retry_dlq():
    """Replay events from the Dead Letter Queue."""
    api_key = request.headers.get('X-Internal-API-Key')
    expected_key = current_app.config.get('INTERNAL_API_KEY', 'dev_internal_key')
    
    if api_key != expected_key:
        return jsonify({"message": "Unauthorized"}), 401
    
    import redis
    import json
    from event_listener import RedisEventListener
    
    redis_url = current_app.config.get('EVENT_BUS_REDIS_URL')
    r = redis.from_url(redis_url)
    
    replayed_count = 0
    while True:
        # Pop from DLQ
        item = r.lpop('dlq:game_events')
        if not item:
            break
            
        try:
            dlq_entry = json.loads(item)
            original_message = dlq_entry['message']
            
            # Manually invoke handler (hacky but effective for simple retry)
            # In a real system, we might re-publish to main queue, but that risks infinite loop.
            # Here we just process it using the listener logic.
            
            # Use a dummy listener instance just to access the method, 
            # or better: refactor handler to be static/standalone. 
            # For now, let's re-publish to 'domain_events' but add a 'retry' flag to avoid loops if needed?
            # Or just duplicate the handle logic here.
            
            # Let's re-publish to 'domain_events' for simplicity.
            # If it fails again, listener pushes back to DLQ.
            r.publish('domain_events', original_message['data']) 
            replayed_count += 1
            
        except Exception as e:
            logger.error(f"Failed to replay DLQ item: {e}")
            # If replay fails, ideally push back to DLQ or a 'FailedDLQ'.
            # pushing back to prevent data loss:
            r.rpush('dlq:game_events', item)
            break # Stop processing to avoid infinite loop
            
    return jsonify({"message": "Replay complete", "count": replayed_count}), 200
