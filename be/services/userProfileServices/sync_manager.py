import os
import sqlalchemy
from sqlalchemy import create_engine, text
from extensions import db
from db.models.user_profile import UserProfile
from routes import process_game_outcome
import logging

logger = logging.getLogger(__name__)

class SyncManager:
    def __init__(self, game_db_url=None):
        self.game_db_url = game_db_url or os.getenv('GAME_DB_URL')
        if not self.game_db_url:
            # Fallback for internal docker communication if not set
            # Assuming standard docker-compose service name and internal port
            self.game_db_url = "postgresql://game_user:game_pass@host.docker.internal:5434/game_db"
        
        self.engine = create_engine(self.game_db_url)

    def reconcile_all_users(self):
        """
        Reconcile stats for ALL users by reading from Game DB.
        """
        logger.info("Starting full reconciliation...")
        try:
            # 1. Fetch Aggregated Stats from Game DB
            stats = self.fetch_aggregated_stats()
            
            # 2. Update User Profiles
            updated_count = 0
            for user_id, user_stats in stats.items():
                self.update_profile_from_stats(user_id, user_stats)
                updated_count += 1
                
            logger.info(f"Reconciliation complete. Updated {updated_count} profiles.")
            return {"status": "success", "updated_count": updated_count}
        except Exception as e:
            logger.error(f"Reconciliation failed: {e}")
            return {"status": "error", "message": str(e)}

    def fetch_aggregated_stats(self):
        """
        Query Game DB to get wins, losses, draws per user.
        """
        query = text("""
            SELECT 
                player_id,
                COUNT(*) as total_games,
                SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as losses,
                SUM(CASE WHEN outcome = 'draw' THEN 1 ELSE 0 END) as draws
            FROM (
                SELECT player1_id as player_id, 
                       CASE 
                           WHEN winner_id = player1_id THEN 'win'
                           WHEN winner_id IS NULL THEN 'draw'
                           ELSE 'loss'
                       END as outcome
                FROM games 
                WHERE status = 'completed'
                UNION ALL
                SELECT player2_id as player_id,
                       CASE 
                           WHEN winner_id = player2_id THEN 'win'
                           WHEN winner_id IS NULL THEN 'draw'
                           ELSE 'loss'
                       END as outcome
                FROM games 
                WHERE status = 'completed' AND player2_id IS NOT NULL
            ) as all_games
            GROUP BY player_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query)
            stats = {}
            for row in result:
                stats[str(row.player_id)] = {
                    'total_games': row.total_games,
                    'wins': row.wins,
                    'losses': row.losses,
                    'draws': row.draws
                }
            return stats

    def update_profile_from_stats(self, user_id, stats):
        """
        Directly update the UserProfile model with calculated stats.
        Note: ELO is harder to reconstruct perfectly without replaying history, 
        so we might trust the current ELO or recalculate if we had full history replay logic.
        For now, we will update W/L/D and Games Played.
        """
        try:
            profile = UserProfile.query.filter_by(id=user_id).first()
            if not profile:
                logger.warning(f"User {user_id} not found in Profile DB during sync. Skipping.")
                return

            profile.games_played = stats['total_games']
            profile.games_won = stats['wins']
            profile.games_lost = stats['losses']
            profile.games_drawn = stats['draws']
            
            # Simplistic Win Streak logic (needs ordered history for perfect accuracy)
            # We will leave streak as-is or reset if inconsistent. Leaving as-is for safety.
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update profile for {user_id}: {e}")
