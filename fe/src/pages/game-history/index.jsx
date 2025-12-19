import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import gameService from '../../utils/gameService';
import userProfileService from '../../utils/userProfileService';
import GameContextHeader from '../../components/ui/GameContextHeader';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';

const GameHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const LIMIT = 10;

    const fetchHistory = async (isLoadMore = false) => {
        if (!user) return;
        try {
            setLoading(true);
            const currentOffset = isLoadMore ? offset : 0;
            
            const response = await gameService.getRecentGames(user.id, LIMIT, currentOffset);
            
            if (response.success) {
                const newGames = await Promise.all(response.data.map(async (game) => {
                    const opponentId = game.player1_id === user.id ? game.player2_id : game.player1_id;
                    let opponentName = "Unknown Opponent";
                    let opponentAvatar = "https://via.placeholder.com/150";

                    if (opponentId) {
                       try {
                           const profileRes = await userProfileService.getProfile(opponentId);
                           if (profileRes.success) {
                               opponentName = profileRes.data.username;
                               opponentAvatar = profileRes.data.avatar_url || opponentAvatar;
                           }
                       } catch (e) {
                           console.error("Failed to fetch opponent", e);
                       }
                    }

                    return {
                        id: game.id,
                        opponent: {
                            name: opponentName,
                            avatar: opponentAvatar
                        },
                        result: game.winner_id === user.id ? "win" : (game.winner_id ? "loss" : "draw"),
                        eloChange: game.winner_id === user.id ? 15 : -10,
                        completedAt: new Date(game.finished_at)
                    };
                }));

                if (newGames.length < LIMIT) {
                    setHasMore(false);
                }

                setGames(prev => isLoadMore ? [...prev, ...newGames] : newGames);
                setOffset(prev => prev + LIMIT);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const handleLoadMore = () => {
        fetchHistory(true);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-background">
            <GameContextHeader title="Game History" onBack={() => navigate('/game-dashboard')} />
            
            <main className="max-w-3xl mx-auto px-4 py-6">
                <div className="space-y-4">
                    {games.map(game => (
                        <div key={game.id} className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    game.result === 'win' ? 'bg-success-50 text-success' : 
                                    game.result === 'loss' ? 'bg-error-50 text-error' : 'bg-warning-50 text-warning'
                                }`}>
                                    <Icon name={game.result === 'win' ? 'Trophy' : 'X'} size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-primary">vs {game.opponent.name}</h4>
                                    <p className="text-xs text-text-secondary">{formatDate(game.completedAt)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-bold ${
                                    game.result === 'win' ? 'text-success' : 
                                    game.result === 'loss' ? 'text-error' : 'text-text-secondary'
                                }`}>
                                    {game.result.toUpperCase()}
                                </span>
                                <div className="text-xs text-text-tertiary">
                                    {game.eloChange > 0 ? '+' : ''}{game.eloChange} ELO
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {games.length === 0 && !loading && (
                        <div className="text-center py-10 text-text-secondary">No games played yet.</div>
                    )}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                                {loading ? 'Loading...' : 'Load More'}
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GameHistory;
