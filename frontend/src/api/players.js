import { apiFetch } from "./client";

export function getPlayers() {
  return apiFetch("/players/");
}
/*export function getMmrHistory() {
  return apiFetch("/players/me/mmr-history");
}*/
export function getMmrHistory(playerId) {
  return apiFetch(`/players/${playerId}/mmr-history`);
}
