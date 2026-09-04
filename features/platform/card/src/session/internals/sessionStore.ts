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
