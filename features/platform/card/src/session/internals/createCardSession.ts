import type { PayCardSession } from "@domain/api-card-management";
import { CARD_SESSION_KEYS, type CardSessionStore } from "./sessionStore";

/**
 * Builds the session accessors over one store. The platform picks the store; everything else about a
 * Card session is the same on every platform.
 */
export function createCardSession(store: CardSessionStore) {
  async function set(session: PayCardSession): Promise<void> {
    // The access token is written last, because it is the only key the request path reads. A cold key
    // that fails then leaves no Bearer behind for a session `get` would refuse to report.
    await Promise.all([
      store.write(CARD_SESSION_KEYS.refreshToken, session.refreshToken),
      store.write(
        CARD_SESSION_KEYS.lifetimes,
        JSON.stringify({
          expiresIn: session.expiresIn,
          refreshTokenExpiresIn: session.refreshTokenExpiresIn,
        }),
      ),
    ]);

    await store.write(CARD_SESSION_KEYS.accessToken, session.accessToken);
  }

  async function get(): Promise<PayCardSession | null> {
    const [accessToken, refreshToken, lifetimes] = await Promise.all([
      store.read(CARD_SESSION_KEYS.accessToken),
      store.read(CARD_SESSION_KEYS.refreshToken),
      store.read(CARD_SESSION_KEYS.lifetimes),
    ]);

    const parsedLifetimes = parseLifetimes(lifetimes);
    if (!accessToken || !refreshToken || !parsedLifetimes) {
      return null;
    }

    return { accessToken, refreshToken, ...parsedLifetimes };
  }

  /**
   * The access token goes first, and no removal may reject. Every Card request reads that key, so a
   * cleared session must stop sending a Bearer even when the store refuses to forget.
   *
   * Never throwing is the load-bearing part: the base query awaits `refreshCardSession` on a 401
   * without a try/catch, so a rejection here would turn a handled 401 into a thrown error that has lost
   * its `status`, and the login machine would read it as a network fault and keep the dead session.
   */
  async function clear(): Promise<void> {
    await store.remove(CARD_SESSION_KEYS.accessToken).catch(() => undefined);
    await Promise.all([
      store.remove(CARD_SESSION_KEYS.refreshToken).catch(() => undefined),
      store.remove(CARD_SESSION_KEYS.lifetimes).catch(() => undefined),
    ]);
  }

  /** The reader `cardApiExtra` gets. One key, because the header needs one value. */
  async function getCardSessionToken(): Promise<string | null> {
    return store.read(CARD_SESSION_KEYS.accessToken);
  }

  /** No renewal yet (LIVE-34741): a 401 ends the session. */
  async function refreshCardSession(): Promise<string | null> {
    await clear();
    return null;
  }

  return { cardSession: { set, get, clear }, getCardSessionToken, refreshCardSession };
}

/**
 * A session is only a session when all three keys agree. A half-written or unreadable payload reads
 * as no session, which sends the user back to the login screen instead of into a broken state.
 */
function parseLifetimes(
  value: string | null,
): Pick<PayCardSession, "expiresIn" | "refreshTokenExpiresIn"> | null {
  if (!value) {
    return null;
  }

  try {
    const { expiresIn, refreshTokenExpiresIn } = JSON.parse(value) as Record<string, unknown>;
    return typeof expiresIn === "number" && typeof refreshTokenExpiresIn === "number"
      ? { expiresIn, refreshTokenExpiresIn }
      : null;
  } catch {
    return null;
  }
}
