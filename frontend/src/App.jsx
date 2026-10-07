import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import { getCurrentPlayer } from "./api/auth";
import "./App.css";
import Dashboard from "./Dashboard";
import { logoutRequest } from "./api/auth";
import { LeftFigure, RightFigure } from "./SideArt";
import History from "./History";
import Profile from "./Profile";

function App() {
  const [view, setView] = useState("login");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingLogin();
  }, []);

  async function checkExistingLogin() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    try {
      const player = await getCurrentPlayer();
      setCurrentPlayer(player);
      setView("dashboard");
    } catch {
      localStorage.removeItem("access_token");
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleLoginSuccess() {
    const player = await getCurrentPlayer();
    setCurrentPlayer(player);
    setView("dashboard");
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("access_token");
      setCurrentPlayer(null);
      setView("login");
    }
  }

  if (checkingAuth) {
    return (
      <div className="app-shell">
        <LeftFigure />
        <RightFigure />
        <p className="content-column muted">Betöltés...</p>
      </div>
    );
  }

  if (view === "dashboard" && currentPlayer) {
    return (
      <div className="app-shell">
        <LeftFigure />
        <RightFigure />
        <Dashboard
          currentPlayer={currentPlayer}
          onLogout={handleLogout}
          onShowHistory={() => setView("history")}
          onShowProfile={() => setView("profile")}
        />
      </div>
    );
  }

  if (view === "history" && currentPlayer) {
    return (
      <div className="app-shell">
        <LeftFigure />
        <RightFigure />
        <History
          currentPlayer={currentPlayer}
          onBack={() => setView("dashboard")}
        />
      </div>
    );
  }
  if (view === "profile" && currentPlayer) {
    return (
      <div className="app-shell">
        <LeftFigure />
        <RightFigure />
        <Profile
          currentPlayer={currentPlayer}
          onBack={() => setView("dashboard")}
          onProfileUpdated={(updated) => setCurrentPlayer(updated)}
        />
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="app-shell">
        <LeftFigure />
        <RightFigure />
        <Register
          onRegisterSuccess={() => setView("login")}
          onSwitchToLogin={() => setView("login")}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <LeftFigure />
      <RightFigure />
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setView("register")}
      />
    </div>
  );
}

export default App;
