import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import { getCurrentPlayer } from "./api/auth";
import "./App.css";

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

  function handleLogout() {
    localStorage.removeItem("access_token");
    setCurrentPlayer(null);
    setView("login");
  }

  if (checkingAuth) {
    return <p>Betöltés...</p>;
  }

  if (view === "dashboard" && currentPlayer) {
    return (
      <div>
        <h1>Bejelentkezve mint {currentPlayer.name}</h1>
        <p>
          Apex fiók: {currentPlayer.apex_username} ({currentPlayer.platform})
        </p>
        <button onClick={handleLogout}>Kijelentkezés</button>
      </div>
    );
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
