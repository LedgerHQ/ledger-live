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

/** One string slot per key. Native writes OS secure storage; web keeps the slots in memory. */
export type CardSessionStore = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
