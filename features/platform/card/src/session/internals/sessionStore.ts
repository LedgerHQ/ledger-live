/** Session key names. `lifetimes` remains only so cleanup removes values from earlier builds. */
export const CARD_SESSION_KEYS = {
  accessToken: "payCard.session.accessToken",
  refreshToken: "payCard.session.refreshToken",
  lifetimes: "payCard.session.lifetimes",
} as const;

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
