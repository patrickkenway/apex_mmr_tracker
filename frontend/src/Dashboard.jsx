import { useState, useEffect } from "react";
import { getPlayers, getApexProfile } from "./api/players";
import {
  createMatch,
  finishMatch,
  getMatchDetails,
  getMatchesForSession,
} from "./api/matches";
import { getSessions, finishSession } from "./api/sessions";

export default function Dashboard({
  currentPlayer,
  onLogout,
  onShowHistory,
  onShowProfile,
}) {
  const [players, setPlayers] = useState([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [lastMatchDetails, setLastMatchDetails] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apexProfile, setApexProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
    restoreActiveState();
    loadApexProfile();
  }, []);

  async function loadPlayers() {
    try {
      const allPlayers = await getPlayers();
      setPlayers(allPlayers.filter((p) => p.id !== currentPlayer.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function restoreActiveState() {
    try {
      const sessions = await getSessions();
      const mySession = sessions.find(
        (s) => s.player_id === currentPlayer.id && s.ended_at === null,
      );

      if (!mySession) {
        return;
      }

      setActiveSessionId(mySession.id);

      const sessionMatches = await getMatchesForSession(mySession.id);

      if (sessionMatches.length === 0) {
        return;
      }

      const lastMatch = sessionMatches[sessionMatches.length - 1];
      const details = await getMatchDetails(lastMatch.id);
      const isStillOpen = details.players.some((p) => p.post_mmr === null);

      if (isStillOpen) {
        setActiveMatch(lastMatch);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadApexProfile() {
    try {
      const profile = await getApexProfile();
      setApexProfile(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  function togglePartner(playerId) {
    setSelectedPartnerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 2
          ? [...prev, playerId]
          : prev,
    );
  }

  async function handleStartMatch() {
    setError(null);
    setLoading(true);

    try {
      const match = await createMatch(
        new Date().toISOString(),
        selectedPartnerIds,
      );
      setActiveMatch(match);
      setActiveSessionId(match.session_id);
      setLastMatchDetails(null);
      setSelectedPartnerIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishMatch() {
    setError(null);
    setLoading(true);

    try {
      await finishMatch(activeMatch.id);
      const details = await getMatchDetails(activeMatch.id);
      setLastMatchDetails(details);
      setActiveMatch(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishSession() {
    setError(null);
    setLoading(true);

    try {
      await finishSession(activeSessionId);
      setActiveMatch(null);
      setActiveSessionId(null);
      setLastMatchDetails(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-column wide">
      <h1 className="brand-heading">
        APEX <span>MMR</span>
      </h1>
      <p className="brand-sub">
        {currentPlayer.name} · {currentPlayer.apex_username} (
        {currentPlayer.platform})
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <button className="btn btn-secondary" onClick={onLogout}>
          Kijelentkezés
        </button>
        <button className="btn btn-secondary" onClick={onShowHistory}>
          Korábbi sessionök
        </button>
        <button className="btn btn-secondary" onClick={onShowProfile}>
          Profil szerkesztése
        </button>
      </div>

      <div className="panel">
        <h2>Aktuális állapot</h2>
        {profileLoading && <p className="muted">Betöltés...</p>}

        {apexProfile && (
          <>
            <div className="apex-identity">
              <div>
                <div className="apex-name">{apexProfile.name}</div>
                {apexProfile.tag && (
                  <div className="muted">[{apexProfile.tag}]</div>
                )}
              </div>
              <div className="rank-column">
                <img
                  src={apexProfile.rank_img}
                  alt={apexProfile.rank_name}
                  className="rank-icon"
                />
                <div className="rank-name">
                  {apexProfile.rank_name} {apexProfile.rank_div}
                </div>
                <div className="muted">{apexProfile.rank_score} RP</div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="value">{apexProfile.level}</div>
                <div className="label">
                  Szint ({apexProfile.to_next_level_percent}%)
                </div>
              </div>
              <div className="stat-box">
                <div className="value">
                  {apexProfile.al_stop_percent_global !== null
                    ? `${apexProfile.al_stop_percent_global}%`
                    : "N/A"}
                </div>
                <div className="label">Globális helyezés</div>
              </div>
              <div className="stat-box">
                <div className="value">{apexProfile.selected_legend}</div>
                <div className="label">Legenda</div>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {!activeMatch && (
        <div className="panel">
          <h2>Új meccs indítása</h2>
          <p className="muted">Partnerek kiválasztása (max 2)</p>
          <div className="partner-tiles">
            {players.length === 0 && (
              <p className="muted">Nincs elérhető partner.</p>
            )}
            {players.map((player) => {
              const isSelected = selectedPartnerIds.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`partner-tile ${isSelected ? "selected" : ""}`}
                  onClick={() => togglePartner(player.id)}
                >
                  {isSelected && <span className="tile-check">✓</span>}
                  <div className="tile-name">{player.name}</div>
                  <div className="tile-username">{player.username}</div>
                </div>
              );
            })}
          </div>{" "}
          <button
            className="btn btn-primary"
            onClick={handleStartMatch}
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            {loading ? "Indítás..." : "Meccs kezdete"}
          </button>
        </div>
      )}

      {activeMatch && (
        <div className="panel">
          <h2>Aktív meccs</h2>
          <p className="muted">
            Meccs #{activeMatch.match_number} · Session #
            {activeMatch.session_id}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleFinishMatch}
            disabled={loading}
          >
            {loading ? "Lezárás..." : "Meccs vége"}
          </button>
        </div>
      )}

      {lastMatchDetails && (
        <div className="panel">
          <h2>Utolsó meccs eredménye</h2>
          {lastMatchDetails.players.map((p) => (
            <div className="mmr-row" key={p.player_id}>
              <span>{p.player_name}</span>
              <span
                className={`mmr-change ${p.mmr_change >= 0 ? "positive" : "negative"}`}
              >
                {p.pre_mmr} → {p.post_mmr} ({p.mmr_change > 0 ? "+" : ""}
                {p.mmr_change})
              </span>
            </div>
          ))}
        </div>
      )}

      {activeSessionId && (
        <button
          className="btn btn-secondary"
          onClick={handleFinishSession}
          disabled={loading}
          style={{ marginBottom: "2rem" }}
        >
          {loading ? "Lezárás..." : "Session lezárása"}
        </button>
      )}
    </div>
  );
}
