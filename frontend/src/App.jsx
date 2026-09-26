import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import { getCurrentPlayer } from "./api/auth";
import "./App.css";
import Dashboard from "./Dashboard";
import { logoutRequest } from "./api/auth";

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
    return <p>Betöltés...</p>;
  }

  if (view === "dashboard" && currentPlayer) {
    return <Dashboard currentPlayer={currentPlayer} onLogout={handleLogout} />;
  }

  if (view === "register") {
    return (
      <Register
        onRegisterSuccess={() => setView("login")}
        onSwitchToLogin={() => setView("login")}
      />
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={() => setView("register")}
    />
  );
}

export default App;
