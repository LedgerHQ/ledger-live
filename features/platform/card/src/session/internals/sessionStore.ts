/**
 * One Card session, over two keys.
 *
 * Every Card request reads the access token, and nothing else. Its own key keeps that path to one
 * small value. The refresh token keeps its own key: the request path never reads it, and the renewal
 * endpoint reads nothing else.
 */
export const CARD_SESSION_KEYS = {
  accessToken: "payCard.session.accessToken",
  refreshToken: "payCard.session.refreshToken",
} as const;

/**
 * Keys an earlier build wrote and this one no longer reads.
 *
 * The two keys above kept their names, so an upgraded device still holds whatever the old build put
 * under a third one. Nothing reads it, but a value in the OS secret store that no code can remove
 * stays there for the life of the install. `removeSession` clears these as well, so the next logout
 * or terminal cleanup takes them.
 */
export const CARD_LEGACY_SESSION_KEYS = ["payCard.session.lifetimes"] as const;

/** One string slot per key. Native writes OS secure storage; web keeps the slots in memory. */
export type CardSessionStore = {
  /**
   * Answers `null` for an empty slot, and rejects when the store could not be read. The two must
   * stay apart: an empty slot ends a session, and a keychain the OS refused says nothing about one.
   */
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
