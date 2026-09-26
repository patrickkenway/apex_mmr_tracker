import { useState } from "react";
import { login } from "./api/auth";

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(username, password);
      localStorage.setItem("access_token", data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-column">
      <h1 className="brand-heading">
        APEX <span>MMR</span>
      </h1>
      <p className="brand-sub">Jelentkezz be, és indítsd a sessiont.</p>
      <div className="panel">
        <h2>Bejelentkezés</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Felhasználónév</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Belépés..." : "Belépés"}
          </button>
        </form>
      </div>
      <p className="muted">
        Nincs még fiókod?{" "}
        <button type="button" className="btn-link" onClick={onSwitchToRegister}>
          Regisztráció
        </button>
      </p>
    </div>
  );
}
