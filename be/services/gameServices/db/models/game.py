from extensions import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Game(db.Model):
    __tablename__ = 'games'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player1_id = db.Column(UUID(as_uuid=True), nullable=False)
    player2_id = db.Column(UUID(as_uuid=True), nullable=True) # Can be null if waiting
    winner_id = db.Column(UUID(as_uuid=True), nullable=True)
    status = db.Column(db.String(20), default='waiting') # waiting, active, completed, abandoned
    
    # Store board state snapshot for persistence (optional, could just be final state)
    final_board_state = db.Column(db.JSON, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    finished_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'player1_id': str(self.player1_id),
            'player2_id': str(self.player2_id) if self.player2_id else None,
            'winner_id': str(self.winner_id) if self.winner_id else None,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'finished_at': self.finished_at.isoformat() if self.finished_at else None
        }
