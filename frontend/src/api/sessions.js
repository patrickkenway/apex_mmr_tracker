import { apiFetch } from "./client";

export function finishSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}/finish`, {
    method: "POST",
  });
}
