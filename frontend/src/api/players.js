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
export function updateProfile(data) {
  return apiFetch("/players/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/players/me/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
