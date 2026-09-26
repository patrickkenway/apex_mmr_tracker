import { apiFetch } from "./client";

export function getSessions() {
  return apiFetch("/sessions/");
}

export function finishSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}/finish`, {
    method: "POST",
  });
}

export function getSessionStats(sessionId) {
  return apiFetch(`/sessions/${sessionId}/stats`);
}
