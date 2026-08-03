// Bundled into the preload: keep it type-only plus the channel constants.

export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

export type Bootstrap = {
  /** Bump on every shape change. */
  version: 1;
  /** Unfiltered (E2E and debug flags read arbitrary keys), minus `CARD_SESSION_BOOTSTRAP`. */
  env: Record<string, string | undefined>;
  os: {
    type: string;
    release: string;
    platform: string;
    hostname: string;
  };
  paths: {
    userData: string;
    home: string;
  };
  appDirname: string;
  distributionChannel: "mac-app-store" | "windows-store" | "direct";
  locale: {
    app: string;
    system: string;
  };
  store: Record<string, unknown>;
};

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
  cardSession: CardSessionBridge;
};

// Every channel is listed here: never add a generic invoke passthrough.
export const CHANNELS = {
  bootstrap: "bootstrap",
  cardSessionBootstrap: "card-session:bootstrap",
} as const;
