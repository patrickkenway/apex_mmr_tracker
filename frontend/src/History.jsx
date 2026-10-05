import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSessions, getSessionStats } from "./api/sessions";
import { getMmrHistory } from "./api/players";

export default function History({ currentPlayer, onBack }) {
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [mmrHistory, setMmrHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPastSessions();
    loadMmrHistory();
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

  async function loadMmrHistory() {
    try {
      const history = await getMmrHistory();
      const formatted = history.map((point) => ({
        date: new Date(point.played_at).toLocaleDateString("hu-HU", {
          month: "short",
          day: "numeric",
        }),
        mmr: point.mmr,
      }));
      setMmrHistory(formatted);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="content-column wide">
      <h1 className="brand-heading">
        MMR <span>TÖRTÉNET</span>
      </h1>
      <button
        className="btn btn-secondary"
        onClick={onBack}
        style={{ marginBottom: "2rem" }}
      >
        Vissza
      </button>

      {error && <p className="error-text">{error}</p>}

      <div className="panel">
        <h2>MMR alakulása</h2>
        {mmrHistory.length === 0 && (
          <p className="muted">Még nincs elég adat a grafikonhoz.</p>
        )}
        {mmrHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mmrHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232A35" />
              <XAxis dataKey="date" stroke="#7C8798" fontSize={12} />
              <YAxis stroke="#7C8798" fontSize={12} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "#12161D",
                  border: "1px solid #232A35",
                }}
                labelStyle={{ color: "#E9EDF2" }}
              />
              <Line
                type="monotone"
                dataKey="mmr"
                stroke="#FF5A34"
                strokeWidth={2}
                dot={{ fill: "#FF5A34", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

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
