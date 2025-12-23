import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import gameService from '../../utils/gameService';
import userProfileService from '../../utils/userProfileService';
import socketService from '../../utils/socketService';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import GameBoard from './components/GameBoard';
import PlayerCard from './components/PlayerCard';
import GameTimer from './components/GameTimer';
import GameChat from './components/GameChat';
import ConnectionStatus from './components/ConnectionStatus';
import GameEndModal from './components/GameEndModal';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const BOARD_SIZE = 13;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const ActiveGameBoard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user, userProfile } = useAuth();

  // Game State
  const [gameState, setGameState] = useState(Array(TOTAL_CELLS).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameStatus, setGameStatus] = useState('active'); // 'active', 'ended', 'waiting'
  const [winningCells, setWinningCells] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  // Player State
  const [isMyTurn, setIsMyTurn] = useState(false); // Validated by backend
  const [mySymbol, setMySymbol] = useState(null);
  const [players, setPlayers] = useState({
      me: { id: user?.id, name: userProfile?.username || 'Me', avatar: userProfile?.avatar_url || 'https://via.placeholder.com/150', elo: userProfile?.elo_rating || 1000 },
      opponent: { id: null, name: 'Opponent', avatar: 'https://via.placeholder.com/150', elo: 1000 }
  });
  
  const [playerTimes, setPlayerTimes] = useState({ me: 120, opponent: 120 });
  const [isThinking, setIsThinking] = useState(false);

  // UI State
  const [showChat, setShowChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [showMoveHistory, setShowMoveHistory] = useState(false);

  // Connection State
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const [latency, setLatency] = useState(45);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      
      socketService.on('connect', onConnect);
      socketService.on('disconnect', onDisconnect);
      
      // Initial check
      setIsConnected(socketService.isConnected);
      
      return () => {
          socketService.off('connect', onConnect);
          socketService.off('disconnect', onDisconnect);
      };
  }, []);

  // Chat - Mock for now
  const [chatMessages, setChatMessages] = useState([]);

  // Initial Fetch
  useEffect(() => {
      // Ensure socket is connected
      if (user?.access_token) {
          socketService.connect(user.access_token);
      }

      const fetchGame = async () => {
          if (!gameId) return;
          const res = await gameService.getGame(gameId);
          if (res.success) {
              const game = res.data;
              // Determine my role
              const amIPlayer1 = game.player1_id === user.id;
              const mySym = amIPlayer1 ? 'X' : 'O';
              setMySymbol(mySym);
              
              // Board State
              if (game.board) {
                  setGameState(game.board);
                  // Determine turn
                  const currentTurn = game.current_player_id === user.id;
                  setIsMyTurn(currentTurn);
                  setCurrentPlayer(game.current_player_id === game.player1_id ? 'X' : 'O');
                  
                  // Reconstruct simple history count
                  const movesMade = game.board.filter(c => c !== null).length;
                  setMoveHistory(Array(movesMade).fill("Move")); 
                  
                  // Initialize Timer from Settings / State
                  if (game.p1_time !== undefined) {
                       setPlayerTimes({
                           me: amIPlayer1 ? game.p1_time : game.p2_time,
                           opponent: amIPlayer1 ? game.p2_time : game.p1_time
                       });
                  } 
                  else if (game.settings && game.settings.timer) {
                       const initial = game.settings.timer.initial;
                       setPlayerTimes({ me: initial, opponent: initial });
                  }
              }
              
              setGameStatus(game.status);
              
              // Opponent Fetch
              let opponentId = null;
              if (amIPlayer1) {
                  opponentId = game.player2_id;
              } else {
                  opponentId = game.player1_id;
              }

              let opponentData = { id: opponentId, name: 'Opponent', avatar: 'https://via.placeholder.com/150', elo: 1000 };
              
              if (opponentId) {
                   const oppRes = await userProfileService.getProfile(opponentId);
                   if (oppRes.success) {
                       opponentData = {
                           id: opponentId,
                           name: oppRes.data.username,
                           avatar: oppRes.data.avatar_url || 'https://via.placeholder.com/150',
                           elo: oppRes.data.elo_rating || 1000
                       };
                   }
              }

              setPlayers(prev => ({
                  ...prev,
                  opponent: opponentData
              }));

              if (game.status === 'completed') {
                   // Handle finished game load
                   // setGameResult(...)
              }
          } else {
              // Handle error (redirect?)
              console.error("Failed to load game");
          }
      };

      fetchGame();
      
      fetchGame();
      
      // Real-time updates via Socket
      socketService.joinGame(gameId);

      const onGameUpdate = (data) => {
          console.log("Game Update:", data);
          if (data.board) {
             setGameState(data.board);
          }
           // Update turn info
          const currentTurn = data.current_player_id === user.id;
          setIsMyTurn(currentTurn);
          setCurrentPlayer(data.current_player_id === data.player1_id ? 'X' : 'O');
          
          // Sync Timer
          if (data.p1_time !== undefined && data.p2_time !== undefined) {
               const amIP1 = data.player1_id === user.id;
               setPlayerTimes({
                   me: amIP1 ? data.p1_time : data.p2_time,
                   opponent: amIP1 ? data.p2_time : data.p1_time
               });
          } else {
               // Fallback / legacy support
               // Default to 30 or whatever settings say if missing
          }
          
          // Redundant Game End Check
          if (data.status === 'completed') {
             console.log("Game completed detected via update");
             // Force call onGameOver logic if status changed drastically
             if (gameStatus !== 'completed') {
                 onGameOver(data); 
             }
          }
      };

      const onGameOver = (data) => {
          console.log("Game Over:", data);
          setGameStatus(data.status); // completed or abandoned
          setWinningCells(data.winning_line || []);
          
          let resultType = 'draw';
          if (data.status === 'abandoned') {
             resultType = 'abandoned';
          } else if (data.winner_id) {
              resultType = data.winner_id === user.id ? 'win' : 'loss';
          }
          
          setGameResult({
              result: resultType,
              winner: resultType === 'win' ? 'me' : (resultType === 'loss' ? 'opponent' : null)
          });
          setTimeout(() => setShowGameEndModal(true), 1500);
      };

      socketService.on('game_update', onGameUpdate);
      socketService.on('game_over', onGameOver);
      
      return () => {
          socketService.leaveGame(gameId);
          socketService.off('game_update', onGameUpdate);
          socketService.off('game_over', onGameOver);
      };
  }, [gameId, user.id, isConnected]); // Add isConnected dependency to retry join if connection happens late

  // Timer Logic
  useEffect(() => {
    // Sync local timer from game state
    // We need to know:
    // 1. My time remaining (if I am p1, use p1_time)
    // 2. Opponent time remaining
    // 3. Who is currently moving
    
    // BUT checking `timeRemaining` variable: currently single variable.
    // We should split or just show MY time if it's my turn? 
    // Usually UI shows BOTH timers. 
    // For now, let's keep `timeRemaining` as "Current Player's Time" to match UI or "My Time"?
    // The current UI seems to show one timer? "0:19 Time Remaining". 
    // Let's assume it shows the current turn's time.
    
    // UPDATE: We need to set `timeRemaining` to whomever is playing.
  }, [gameState]); // trigger on state update

  // Timer Countdown Logic
  useEffect(() => {
    let interval;
    if (gameStatus === 'active') {
      interval = setInterval(() => {
        setPlayerTimes(prev => {
           // Decide who is playing
           // isMyTurn is true -> decrement ME
           // isMyTurn is false -> decrement OPPONENT
           
           if (isMyTurn) {
               return { ...prev, me: Math.max(0, prev.me - 1) };
           } else {
               return { ...prev, opponent: Math.max(0, prev.opponent - 1) };
           }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, isMyTurn]);
  
  // Note: `timeRemaining` is updated in `onGameUpdate`
  // We need to ensure we set it to the correct value from server state.
  // Server sends: p1_time, p2_time.
  
  // Handled in onGameUpdate and fetchGame.

  // Reset timer on turn change?
  // The backend store 'updated_at' which resets on move.
  // When we receive 'game_update', we should reset the timer to 30!
  
  useEffect(() => {
       // Reset timer when turn changes (or rather, when board/player changes)
       // We can detect this via 'currentPlayer' change or just 'game_update' event handling.
       // Handled in onGameUpdate below (I should add it there).
  }, [currentPlayer]); // ...



  const handleCellClick = async (index) => {
    if (gameState[index] !== null || !isMyTurn || gameStatus !== 'active') {
      return;
    }

    // Optimistic Update
    const newGameState = [...gameState];
    newGameState[index] = mySymbol;
    setGameState(newGameState);
    setIsMyTurn(false); // Temporary lock
    
    const res = await gameService.makeMove(gameId, index, user.id);
    if (!res.success) {
        // Revert on failure
        // Should actually re-fetch state here to be safe
        console.error("Move failed", res.error);
        setIsMyTurn(true); 
        newGameState[index] = null;
        setGameState(newGameState);
    } else {
        // Apply backend state
        const updatedState = res.data;
        setGameState(updatedState.board);
        
        // Check game over
        if (updatedState.status === 'completed') {
            setGameStatus('completed');
            setWinningCells(updatedState.winning_line || []);
            
            let resultType = 'draw';
            if (updatedState.winner_id) {
                resultType = updatedState.winner_id === user.id ? 'win' : 'loss';
            }
            
            setGameResult({
                result: resultType,
                winner: resultType === 'win' ? 'me' : (resultType === 'loss' ? 'opponent' : null)
            });
            setTimeout(() => setShowGameEndModal(true), 1500);
        } else {
             setIsMyTurn(updatedState.current_player_id === user.id);
             setCurrentPlayer(updatedState.current_player_id === updatedState.player1_id ? 'X' : 'O');
        }
    }
  };


  // Chat Functions
  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      sender: 'you',
      senderName: 'You',
      content: message,
      type: 'text',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleSendEmoji = (emoji) => {
    const newMessage = {
      id: Date.now(),
      sender: 'you',
      senderName: 'You',
      content: emoji,
      type: 'emoji',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Game End Functions
  const handleRematch = () => {
    // Implement remix/create new game logic
    navigate('/matchmaking-game-lobby');
  };

  const handleNewGame = () => {
    navigate('/matchmaking-game-lobby');
  };

  const handleBackClick = () => {
    navigate('/game-dashboard'); // Back to Dashboard
  };

  const handleReconnect = () => {
    setReconnectAttempts(prev => prev + 1);
    setTimeout(() => {
      setIsConnected(true);
      setReconnectAttempts(0);
    }, 2000);
  };

  const mockEloChanges = gameResult ? {
    oldRating: players.me.elo,
    newRating: players.me.elo + (gameResult.result === 'win' ? 25 : gameResult.result === 'loss' ? -18 : 5),
    change: gameResult.result === 'win' ? 25 : gameResult.result === 'loss' ? -18 : 5,
    opponentOldRating: players.opponent.elo,
    opponentNewRating: players.opponent.elo + (gameResult.result === 'win' ? -18 : gameResult.result === 'loss' ? 25 : 5),
    opponentChange: gameResult.result === 'win' ? -18 : gameResult.result === 'loss' ? 25 : 5
  } : null;

  const mockGameStats = gameResult ? {
    duration: '5:34',
    totalMoves: gameState.filter(cell => cell !== null).length,
    moveHistory: []
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Game Context Header */}
      <GameContextHeader
        gameState={gameStatus}
        opponent={players.opponent}
        eloStakes={25}
        currentPlayer={isMyTurn ? 'you' : players.opponent.name}
        showBackButton={true}
        onBackClick={handleBackClick}
        title="Active Game"
      />

      {/* Connection Status */}
      <ConnectionStatus
        isConnected={isConnected}
        latency={latency}
        onReconnect={handleReconnect}
        reconnectAttempts={reconnectAttempts}
      />

      {/* Main Game Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Opponent Player Card */}
            <PlayerCard
              player={players.opponent}
              isCurrentPlayer={!isMyTurn}
              symbol={mySymbol === 'X' ? 'O' : 'X'}
              position="top"
              capturedSquares={gameState.filter(cell => cell === (mySymbol === 'X' ? 'O' : 'X')).length}
              isConnected={isConnected}
              isThinking={!isMyTurn && gameStatus === 'active'}
              timer={playerTimes.opponent}
            />

            {/* Game Board */}
            <div className="flex justify-center">
                {/* Ensure GameBoard component handles 13x13 grid styling. 
                    It likely needs CSS Grid update if it hardcodes 3x3. 
                    Assuming GameBoard is flexible or we update it next. */}
              <GameBoard
                gameState={gameState}
                currentPlayer={currentPlayer}
                isMyTurn={isMyTurn}
                onCellClick={handleCellClick}
                gameStatus={gameStatus}
                winningCells={winningCells}
                disabled={!isConnected}
                boardSize={13} 
              />
            </div>

            {/* My Player Card */}
            <PlayerCard
              player={players.me}
              isCurrentPlayer={isMyTurn}
              symbol={mySymbol}
              position="bottom"
              capturedSquares={gameState.filter(cell => cell === mySymbol).length}
              isConnected={isConnected}
              timer={playerTimes.me}
            />

            {/* Mobile Game Actions */}
            <div className="lg:hidden flex justify-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowChat(!showChat)}
                iconName="MessageCircle"
                iconPosition="left"
              >
                Chat ({chatMessages.length})
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setShowMoveHistory(!showMoveHistory)}
                iconName="History"
                iconPosition="left"
              >
                History
              </Button>
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            {/* Game Chat */}
            <GameChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onSendEmoji={handleSendEmoji}
              isExpanded={isChatExpanded}
              onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
              disabled={!isConnected}
            />

            {/* Move History */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center space-x-2">
                <Icon name="History" size={20} color="var(--color-text-primary)" />
                <span>Move History</span>
              </h3>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                 {/* Simplified history for now */}
                {gameState.map((cell, index) => cell && (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Move:
                    </span>
                    <span className="font-data font-medium text-text-primary">
                       {/* Coordinate logic for 13x13 */}
                      {cell} → {String.fromCharCode(65 + (index % 13))}{Math.floor(index / 13) + 1}
                    </span>
                  </div>
                ))}
                {gameState.every(cell => cell === null) && (
                  <div className="text-center text-text-secondary text-sm py-4">
                    No moves yet
                  </div>
                )}
              </div>
            </div>

            {/* Game Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleBackClick}
                iconName="Home"
                iconPosition="left"
                fullWidth
              >
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setShowChat(!showChat)}
                iconName="MessageCircle"
                iconPosition="left"
                fullWidth
              >
                Toggle Chat
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Chat Overlay */}
      {showChat && (
        <div className="lg:hidden fixed inset-0 z-100 bg-background/80 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg">Game Chat</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowChat(false)}
                  iconName="X"
                  className="p-2 h-auto"
                />
              </div>
              
              <GameChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onSendEmoji={handleSendEmoji}
                isExpanded={true}
                onToggleExpanded={() => {}}
                disabled={!isConnected}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game End Modal */}
      <GameEndModal
        isOpen={showGameEndModal}
        gameResult={gameResult}
        onClose={() => setShowGameEndModal(false)}
        onRematch={handleRematch}
        onNewGame={handleNewGame}
        eloChanges={mockEloChanges}
        gameStats={mockGameStats}
        opponent={players.opponent}
      />

      {/* Bottom Navigation */}
      <BottomTabNavigation
        activeGameCount={1}
        unreadNotifications={0}
        userRank={156} // Dynamic rank later
      />
    </div>
  );
};

export default ActiveGameBoard;