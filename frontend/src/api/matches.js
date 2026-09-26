import { apiFetch } from "./client";

export function createMatch(playedAt, partnerPlayerIds) {
  return apiFetch("/matches/", {
    method: "POST",
    body: JSON.stringify({
      played_at: playedAt,
      partner_player_ids: partnerPlayerIds,
    }),
  });
}

export function finishMatch(matchId) {
  return apiFetch(`/matches/${matchId}/finish`, {
    method: "POST",
  });
}

export function getMatchDetails(matchId) {
  return apiFetch(`/matches/${matchId}`);
}
