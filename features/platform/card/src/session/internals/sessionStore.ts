/**
 * One Card session, spread over three keys.
 *
 * `expo-secure-store` warns above 2048 bytes per value and says it may throw in a later SDK. Two
 * JWTs in one JSON blob can pass that limit, so each token gets its own key. The access token is
 * alone in its key for a second reason: every Card request reads it, and nothing else.
 */
export const CARD_SESSION_KEYS = {
  accessToken: "payCard.session.accessToken",
  refreshToken: "payCard.session.refreshToken",
  lifetimes: "payCard.session.lifetimes",
} as const;

/** One string slot per key. Native writes OS secure storage; web keeps the slots in memory. */
export type CardSessionStore = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
