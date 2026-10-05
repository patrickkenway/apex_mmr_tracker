import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer,
} from "recharts";
import { getSessions, getSessionStats } from "./api/sessions";
import { getMmrHistory, getPlayers } from "./api/players";

const EMBER = "#FF5A34";
const SIGNAL = "#35B7E0";

function buildBuckets(rawHistory, granularity) {
  if (granularity === "match") {
    return rawHistory.map((point) => ({
      ts: new Date(point.played_at).getTime(),
      mmr: point.mmr,
    }));
  }

  const groupKey = (point) =>
    granularity === "session"
      ? point.session_id
      : new Date(point.played_at).toDateString();

  const lastByGroup = new Map();

  for (const point of rawHistory) {
    lastByGroup.set(groupKey(point), point);
  }

  return Array.from(lastByGroup.values())
    .sort((a, b) => new Date(a.played_at) - new Date(b.played_at))
    .map((point) => ({
      ts: new Date(point.played_at).getTime(),
      mmr: point.mmr,
    }));
}

function mergeSeries(mine, other) {
  const map = new Map();

  for (const point of mine) {
    map.set(point.ts, { ts: point.ts, mine: point.mmr });
  }

  for (const point of other) {
    const existing = map.get(point.ts);
    if (existing) {
      existing.other = point.mmr;
    } else {
      map.set(point.ts, { ts: point.ts, other: point.mmr });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
}

function formatTick(ts) {
  return new Date(ts).toLocaleDateString("hu-HU", {
    month: "short",
    day: "numeric",
  });
}

export default function History({ currentPlayer, onBack }) {
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [players, setPlayers] = useState([]);
  const [rawHistory, setRawHistory] = useState([]);
  const [rawHistoryOther, setRawHistoryOther] = useState([]);
  const [granularity, setGranularity] = useState("session");
  const [comparePlayerId, setComparePlayerId] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPastSessions();
    loadPlayers();
    loadMyHistory();
  }, []);

  useEffect(() => {
    if (!comparePlayerId) {
      setRawHistoryOther([]);
      return;
    }
    loadOtherHistory(comparePlayerId);
  }, [comparePlayerId]);

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

  async function loadPlayers() {
    try {
      const allPlayers = await getPlayers();
      setPlayers(allPlayers.filter((p) => p.id !== currentPlayer.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMyHistory() {
    try {
      const history = await getMmrHistory(currentPlayer.id);
      setRawHistory(history);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadOtherHistory(playerId) {
    try {
      const history = await getMmrHistory(playerId);
      setRawHistoryOther(history);
    } catch (err) {
      setError(err.message);
    }
  }

  const chartData = useMemo(() => {
    const mine = buildBuckets(rawHistory, granularity);
    const other = buildBuckets(rawHistoryOther, granularity);
    return mergeSeries(mine, other);
  }, [rawHistory, rawHistoryOther, granularity]);

  const otherPlayerName = players.find(
    (p) => p.id === Number(comparePlayerId),
  )?.name;

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

        <div className="toggle-group">
          <button
            className={`btn-toggle ${granularity === "match" ? "active" : ""}`}
            onClick={() => setGranularity("match")}
          >
            Minden meccs
          </button>
          <button
            className={`btn-toggle ${granularity === "session" ? "active" : ""}`}
            onClick={() => setGranularity("session")}
          >
            Session végén
          </button>
          <button
            className={`btn-toggle ${granularity === "day" ? "active" : ""}`}
            onClick={() => setGranularity("day")}
          >
            Naponta
          </button>
        </div>

        <select
          className="compare-select"
          value={comparePlayerId}
          onChange={(e) => setComparePlayerId(e.target.value)}
        >
          <option value="">Nincs összehasonlítás</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              Összehasonlítás: {p.name}
            </option>
          ))}
        </select>

        {chartData.length === 0 && (
          <p className="muted">Még nincs elég adat a grafikonhoz.</p>
        )}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232A35" />
              <XAxis
                dataKey="ts"
                type="number"
                domain={["auto", "auto"]}
                tickFormatter={formatTick}
                stroke="#7C8798"
                fontSize={12}
              />
              <YAxis stroke="#7C8798" fontSize={12} domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={formatTick}
                contentStyle={{
                  background: "#12161D",
                  border: "1px solid #232A35",
                }}
                labelStyle={{ color: "#E9EDF2" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="mine"
                name={currentPlayer.name}
                stroke={EMBER}
                strokeWidth={2}
                dot={{ fill: EMBER, r: 3 }}
                connectNulls
              />
              {comparePlayerId && (
                <Line
                  type="monotone"
                  dataKey="other"
                  name={otherPlayerName}
                  stroke={SIGNAL}
                  strokeWidth={2}
                  dot={{ fill: SIGNAL, r: 3 }}
                  connectNulls
                />
              )}
              <Brush
                dataKey="ts"
                height={24}
                stroke={EMBER}
                tickFormatter={formatTick}
                travellerWidth={8}
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
