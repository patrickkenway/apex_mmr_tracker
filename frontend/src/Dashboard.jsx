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
        (s) => s.player_id === currentPlayer.id && s.ended_at === null
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
