import { io } from "socket.io-client";

// This should point to your WebSocket Gateway
const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:5005";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      if (this.currentToken === token) {
        return this.socket;
      }
      // Token changed, disconnect old socket
      this.disconnect();
    }
    
    if (!token) {
        console.warn("Socket connect called without token");
        return null;
    }

    this.currentToken = token;

    // Pass token in query params as required by Gateway auth
    this.socket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinGame(gameId) {
    if (this.socket) {
      this.socket.emit("join_game", { game_id: gameId });
    }
  }

  leaveGame(gameId) {
    if (this.socket) {
      this.socket.emit("leave_game", { game_id: gameId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
