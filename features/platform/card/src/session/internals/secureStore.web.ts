import type { CardSessionStore } from "./sessionStore";

/**
 * The web and desktop half. Electron exposes no OS secret store in this repo, so the session lives
 * in renderer memory and a restart asks for a new login. That is the answer, not a shim: a Bearer
 * credential must not join the persisted redux state.
 */
const slots = new Map<string, string>();

export const secureStore: CardSessionStore = {
  async read(key) {
    return slots.get(key) ?? null;
  },
  async write(key, value) {
    slots.set(key, value);
  },
  async remove(key) {
    slots.delete(key);
  },
};
