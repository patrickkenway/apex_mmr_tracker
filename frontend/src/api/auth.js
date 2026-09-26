import { apiFetch } from "./client";

export function login(username, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function register(playerData) {
  return apiFetch("/players/", {
    method: "POST",
    body: JSON.stringify(playerData),
  });
}

export function getCurrentPlayer() {
  return apiFetch("/auth/me");
}
