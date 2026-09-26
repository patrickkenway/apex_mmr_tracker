import { apiFetch } from "./client";

export function getPlayers() {
  return apiFetch("/players/");
}
