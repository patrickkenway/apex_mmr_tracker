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
    <div>
      <h2>Regisztráció</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Név</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Felhasználónév</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Jelszó</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Apex felhasználónév</label>
          <input
            type="text"
            name="apex_username"
            value={formData.apex_username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
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
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Regisztráció..." : "Regisztráció"}
        </button>
      </form>
      <p>
        Már van fiókod?{" "}
        <button type="button" onClick={onSwitchToLogin}>
          Bejelentkezés
        </button>
      </p>
    </div>
  );
}
