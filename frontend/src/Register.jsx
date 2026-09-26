import { useState } from "react";
import { register } from "./api/auth";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    apex_username: "",
    platform: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(formData);
      onRegisterSuccess();
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
      <p className="brand-sub">Hozd létre a profilod.</p>
      <div className="panel">
        <h2>Regisztráció</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Név</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Felhasználónév</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Jelszó</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Apex felhasználónév</label>
            <input
              type="text"
              name="apex_username"
              value={formData.apex_username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Platform</label>
            <input
              type="text"
              name="platform"
              placeholder="pl. PC, PS4, X1"
              value={formData.platform}
              onChange={handleChange}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Regisztráció..." : "Regisztráció"}
          </button>
        </form>
      </div>
      <p className="muted">
        Már van fiókod?{" "}
        <button type="button" className="btn-link" onClick={onSwitchToLogin}>
          Bejelentkezés
        </button>
      </p>
    </div>
  );
}
