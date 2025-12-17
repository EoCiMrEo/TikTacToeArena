from extensions import db
from datetime import datetime
import uuid

class MatchQueue(db.Model):
    __tablename__ = 'match_queue'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), unique=True, nullable=False) # UUID stored as string
    elo = db.Column(db.Integer, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'elo': self.elo,
            'joined_at': self.joined_at.isoformat()
        }
