/**
 * One Card session, spread over three keys.
 *
 * Every Card request reads the access token, and nothing else. Its own key keeps that path to one
 * small value, instead of a JSON blob that carries two JWTs the request never needs. The refresh
 * token then keeps its own key too, and the two lifetimes share a third.
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
