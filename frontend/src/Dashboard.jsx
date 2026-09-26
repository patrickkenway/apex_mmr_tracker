import { useState, useEffect } from "react";
import { getPlayers } from "./api/players";
import { getSessions, finishSession } from "./api/sessions";
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

  useEffect(() => {
    loadPlayers();
    restoreActiveState();
  }, []);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Bejelentkezve mint {currentPlayer.name}</h1>
      <p>
        Apex fiók: {currentPlayer.apex_username} ({currentPlayer.platform})
      </p>
      <button onClick={onLogout}>Kijelentkezés</button>

      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!activeMatch && (
        <div>
          <h2>Új meccs indítása</h2>
          <p>Partnerek kiválasztása (max 2):</p>
          {players.length === 0 && <p>Nincs elérhető partner.</p>}
          {players.map((player) => (
            <label key={player.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={selectedPartnerIds.includes(player.id)}
                onChange={() => togglePartner(player.id)}
              />
              {player.name} ({player.username})
            </label>
          ))}
          <button onClick={handleStartMatch} disabled={loading}>
            {loading ? "Indítás..." : "Meccs kezdete"}
          </button>
        </div>
      )}

      {activeMatch && (
        <div>
          <h2>Aktív meccs</h2>
          <p>Meccs #{activeMatch.match_number}</p>
          <p>Session ID: {activeMatch.session_id}</p>
          <button onClick={handleFinishMatch} disabled={loading}>
            {loading ? "Lezárás..." : "Meccs vége"}
          </button>
        </div>
      )}

      {lastMatchDetails && (
        <div>
          <h2>Utolsó meccs eredménye</h2>
          <ul>
            {lastMatchDetails.players.map((p) => (
              <li key={p.player_id}>
                {p.player_name}: {p.pre_mmr} → {p.post_mmr} (
                {p.mmr_change > 0 ? "+" : ""}
                {p.mmr_change})
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeSessionId && (
        <div>
          <hr />
          <button onClick={handleFinishSession} disabled={loading}>
            {loading ? "Lezárás..." : "Session lezárása"}
          </button>
        </div>
      )}
    </div>
  );
}
