import { useState } from "react";
import { updateProfile, changePassword } from "./api/players";

export default function Profile({ currentPlayer, onBack, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    name: currentPlayer.name,
    username: currentPlayer.username,
    apex_username: currentPlayer.apex_username,
    platform: currentPlayer.platform,
  });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const updated = await updateProfile(formData);
      onProfileUpdated(updated);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="content-column">
      <h1 className="brand-heading">
        PROFIL <span>SZERKESZTÉS</span>
      </h1>
      <button
        className="btn btn-secondary"
        onClick={onBack}
        style={{ marginBottom: "2rem" }}
      >
        Vissza
      </button>

      <div className="panel">
        <h2>Adataid</h2>
        <form onSubmit={handleProfileSubmit}>
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
              value={formData.platform}
              onChange={handleChange}
              required
            />
          </div>
          {profileError && <p className="error-text">{profileError}</p>}
          {profileSuccess && (
            <p style={{ color: "var(--positive)" }}>Sikeresen mentve.</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
          >
            {profileLoading ? "Mentés..." : "Mentés"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Jelszó módosítása</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="field">
            <label>Jelenlegi jelszó</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Új jelszó</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          {passwordError && <p className="error-text">{passwordError}</p>}
          {passwordSuccess && (
            <p style={{ color: "var(--positive)" }}>Jelszó módosítva.</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Mentés..." : "Jelszó módosítása"}
          </button>
        </form>
      </div>
    </div>
  );
}
