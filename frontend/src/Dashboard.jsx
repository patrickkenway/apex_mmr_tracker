import { useState, useEffect } from "react";
import { getPlayers } from "./api/players";
import { getSessions, finishSession, getSessionStats } from "./api/sessions";
import {
  createMatch,
  finishMatch,
  getMatchDetails,
  getMatchesForSession,
} from "./api/matches";

export default function Dashboard({ currentPlayer, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [lastMatchDetails, setLastMatchDetails] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({});

  useEffect(() => {
    loadPlayers();
    restoreActiveState();
    loadPastSessions();
  }, []);

  async function loadPastSessions() {
    try {
      const sessions = await getSessions();
      const myFinishedSessions = sessions
        .filter((s) => s.player_id === currentPlayer.id && s.ended_at !== null)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

      setPastSessions(myFinishedSessions);

      const statsEntries = await Promise.all(
        myFinishedSessions.map(async (s) => {
          const stats = await getSessionStats(s.id);
          return [s.id, stats];
        }),
      );

      setSessionStats(Object.fromEntries(statsEntries));
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

  async function loadPlayers() {
    try {
      const allPlayers = await getPlayers();
      setPlayers(allPlayers.filter((p) => p.id !== currentPlayer.id));
    } catch (err) {
      setError(err.message);
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
      await loadPastSessions();
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
      <button
        className="btn btn-secondary"
        onClick={onLogout}
        style={{ marginBottom: "2rem" }}
      >
        Kijelentkezés
      </button>

      {error && <p className="error-text">{error}</p>}

      {!activeMatch && (
        <div className="panel">
          <h2>Új meccs indítása</h2>
          <p className="muted">Partnerek kiválasztása (max 2)</p>
          <div className="partner-list">
            {players.length === 0 && (
              <p className="muted">Nincs elérhető partner.</p>
            )}
            {players.map((player) => (
              <label key={player.id}>
                <input
                  type="checkbox"
                  checked={selectedPartnerIds.includes(player.id)}
                  onChange={() => togglePartner(player.id)}
                />
                {player.name} ({player.username})
              </label>
            ))}
          </div>
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

      <div className="panel">
        <h2>Korábbi sessionök</h2>
        {pastSessions.length === 0 && (
          <p className="muted">Még nincs lezárt session.</p>
        )}
        {pastSessions.map((session) => (
          <div className="session-entry" key={session.id}>
            <p className="session-entry-title">
              Session #{session.id} ·{" "}
              {new Date(session.started_at).toLocaleString("hu-HU")}
            </p>
            {(sessionStats[session.id]?.mmr_changes ?? []).map((change) => (
              <div className="mmr-row" key={change.player_id}>
                <span>{change.player_name}</span>
                <span
                  className={`mmr-change ${change.total_mmr_change >= 0 ? "positive" : "negative"}`}
                >
                  {change.total_mmr_change > 0 ? "+" : ""}
                  {change.total_mmr_change}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
