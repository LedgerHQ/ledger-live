import type { CardLogoutPorts } from "./types";

/**
 * Ends the session, in the order the login machine used before the two components split.
 *
 * Best effort by design, and the caller never has to handle a failure: a provider that refuses to end
 * its own session must not keep the user signed in here, and a session left behind heals itself,
 * because the next request answers 401 and the base query clears it.
 */
export async function runLogout(ports: CardLogoutPorts): Promise<void> {
  await ports.logout().catch(() => undefined);

  try {
    await ports.clearSession();
  } catch {
    // Nothing to hand back. The flag below already ends the session for this process.
  } finally {
    // These run even when the session store refuses. A user left in the Card cache would keep every
    // other screen showing whoever just logged out.
    await ports.clearAttempt().catch(() => undefined);
    ports.forgetUser();
    ports.setSignedIn(false);
  }
}

const running = new WeakSet<CardLogoutPorts>();

export function startLogout(ports: CardLogoutPorts): void {
  if (running.has(ports)) {
    return;
  }
  running.add(ports);
  void runLogout(ports).finally(() => running.delete(ports));
}
