import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import UserRegistration from "pages/user-registration";
import UserLogin from "pages/user-login";
import MatchmakingGameLobby from "pages/matchmaking-game-lobby";
import GameDashboard from "pages/game-dashboard";
import ActiveGameBoard from "pages/active-game-board";
import RankingsLeaderboard from "pages/rankings-leaderboard";
import VerifyEmail from "pages/verify-email";
import NotFound from "pages/NotFound";
import UserProfile from "pages/user-profile";
import ProtectedRoute from "components/ProtectedRoute";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your routes here */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GameDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/user-registration" element={<UserRegistration />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/matchmaking-game-lobby"
          element={
            <ProtectedRoute>
              <MatchmakingGameLobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-dashboard"
          element={
            <ProtectedRoute>
              <GameDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/active-game-board"
          element={
            <ProtectedRoute>
              <ActiveGameBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rankings-leaderboard"
          element={
            <ProtectedRoute>
              <RankingsLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;