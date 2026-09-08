/**
 * Lets the infrastructure layer (which has no business owning a React
 * context) tell the presentation layer that the session was invalidated,
 * e.g. because the refresh token expired mid-request.
 */
const EVENT_NAME = "grana:session-expired";

export const sessionEvents = {
  emitExpired() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  },
  onExpired(handler: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  },
};
