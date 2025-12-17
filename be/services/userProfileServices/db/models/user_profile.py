import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from extensions import db

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    # Primary key - matches Auth User ID from Supabase
    id = db.Column(UUID(as_uuid=True), primary_key=True)
    
    # User identity (cached from auth for convenience)
    username = db.Column(db.String(50), nullable=True, index=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    full_name = db.Column(db.String(200), nullable=True)
    
    # Game Statistics
    games_played = db.Column(db.Integer, default=0)
    games_won = db.Column(db.Integer, default=0)
    games_lost = db.Column(db.Integer, default=0)
    games_drawn = db.Column(db.Integer, default=0)
    
    # Streak Tracking
    win_streak = db.Column(db.Integer, default=0)
    best_win_streak = db.Column(db.Integer, default=0)
    
    # Ranking/ELO
    elo_rating = db.Column(db.Integer, default=1200)
    current_rank = db.Column(db.String(50), default='Unranked')
    last_season_rank = db.Column(db.String(50), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, id, **kwargs):
        self.id = id
        for key, value in kwargs.items():
            setattr(self, key, value)

    @property
    def win_rate(self):
        """Calculate win rate as a percentage."""
        if self.games_played == 0:
            return 0.0
        return round((self.games_won / self.games_played) * 100, 2)

    def to_dict(self):
        """Convert to dictionary format matching frontend expectations."""
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'games_played': self.games_played,
            'games_won': self.games_won,
            'games_lost': self.games_lost,
            'games_drawn': self.games_drawn,
            'win_streak': self.win_streak,
            'best_win_streak': self.best_win_streak,
            'win_rate': self.win_rate,
            'elo_rating': self.elo_rating,
            'current_rank': self.current_rank,
            'last_season_rank': self.last_season_rank,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
