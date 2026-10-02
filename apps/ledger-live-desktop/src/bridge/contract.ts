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
  distributionChannel: "mac-app-store" | "windows-store" | "direct";
  store: Record<string, unknown>;
};

/**
 * One method per operation, never a generic `invoke(channel)`: that would expose all of main,
 * including setEncryptionKey + isEncryptionKeyCorrect, an offline oracle on the account db.
 */
export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  setKey(ns: string, keyPath: string, value: Serializable): Promise<void>;
  hasEncryptionKey(ns: string, keyPath: string): Promise<boolean>;
  setEncryptionKey(encryptionKey: string): Promise<void>;
  removeEncryptionKey(): Promise<void>;
  isEncryptionKeyCorrect(encryptionKey: string): Promise<boolean>;
  hasBeenDecrypted(): Promise<boolean>;
  resetAll(): Promise<void>;
  reload(): Promise<void>;
  cleanCache(): Promise<void>;
};

type TransportError = { message: string; id: string };

export type TransportOpenResult =
  | { type: "open-response"; requestId: string; data: { descriptor: string } }
  | { type: "open-error"; requestId: string; error: TransportError };

export type TransportExchangeResult =
  | { type: "exchange-response"; requestId: string; data: string }
  | { type: "exchange-error"; requestId: string; error: TransportError };

export type TransportListenResult =
  | {
      type: "listen-response";
      requestId: string;
      data: { type: string; descriptor: string; device: unknown };
    }
  | { type: "listen-error"; requestId: string; error: TransportError };

/** Speculos and the HTTP proxy only: real devices use WebHID from the renderer. */
export type TransportBridge = {
  open(requestId: string, descriptor: string, timeout?: number): Promise<TransportOpenResult>;
  exchange(requestId: string, apduHex: string, timeout?: number): Promise<TransportExchangeResult>;
  close(requestId: string): Promise<{ type: "close-response"; requestId: string }>;
  listen(requestId: string): Promise<TransportListenResult>;
  listenUnsubscribe(
    requestId: string,
  ): Promise<{ type: "unsubscribe-response"; requestId: string }>;
};

/** A closure: listener identity does not survive the bridge, so removeListener would no-op. */
export type Unsubscribe = () => void;

export type UpdaterStatusEvent = {
  status: string;
  payload?: { percent?: number; version?: string };
};

export type UpdaterBridge = {
  init(): void;
  quitAndInstall(): void;
  onStatus(callback: (event: UpdaterStatusEvent) => void): Unsubscribe;
};

export type DeeplinkBridge = {
  open(url: string): void;
  onOpen(callback: (url: string) => void): Unsubscribe;
};

export type SaveRequest = {
  options: Electron.SaveDialogOptions;
  /** Honoured only when PLAYWRIGHT_RUN is set in main. */
  e2ePath?: string;
};

export type SaveOutcome = "saved" | "canceled" | "failed";

export type AppBridge = {
  reload(): void;
  relaunch(): void;
  quit(): void;
  show(): void;
};

export type FilesBridge = {
  /** Pre-stringified: the logs hold circular references the bridge cannot carry. */
  saveLogs(request: SaveRequest, logsJson: string): Promise<SaveOutcome>;
  exportOperations(request: SaveRequest, csv: string): Promise<SaveOutcome>;
  savePng(options: Electron.SaveDialogOptions, base64: string): Promise<SaveOutcome>;
  openUserDataDirectory(): Promise<unknown>;
};

export type PowerBridge = {
  keepScreenAwake(): Promise<number>;
  release(blockerId?: number): Promise<void>;
};

export type StoreBridge = {
  set(key: string, value: unknown): void;
  clear(): void;
};

/** Its own group, so the lint guardrail matching on a `shell` object still sees the facade. */
export type ShellBridge = {
  openExternal(url: string): void;
};

export type SystemBridge = {
  clipboardWriteText(text: string): void;
  /** Resolves null when the clipboard cannot be read, which is not the same as empty. */
  clipboardReadText(): Promise<string | null>;
  setVisualZoomLevelLimits(minimum: number, maximum: number): void;
  getResourceUsage(): Electron.ResourceUsage | undefined;
};

/** The only channel parameter: the preload restricts it to coin-zcash's `ZCASH_IPC` list. */
export type ZcashBridge = {
  invoke(channel: string, args: unknown): Promise<unknown>;
  subscribe(channel: string, callback: (payload: unknown) => void): Unsubscribe;
};

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
  shell: ShellBridge;
  system: SystemBridge;
  zcash: ZcashBridge;
  db: DbBridge;
  transport: TransportBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
  app: AppBridge;
  files: FilesBridge;
  power: PowerBridge;
  store: StoreBridge;
  cardSession: CardSessionBridge;
};

// Every channel is listed here: never add a generic invoke passthrough.
export const CHANNELS = {
  bootstrap: "bootstrap",
  storeSet: "lld-store:set",
  storeClear: "lld-store:clear",
  getKey: "getKey",
  setKey: "setKey",
  hasEncryptionKey: "hasEncryptionKey",
  setEncryptionKey: "setEncryptionKey",
  removeEncryptionKey: "removeEncryptionKey",
  isEncryptionKeyCorrect: "isEncryptionKeyCorrect",
  hasBeenDecrypted: "hasBeenDecrypted",
  resetAll: "resetAll",
  reload: "reload",
  cleanCache: "cleanCache",
  transportOpen: "transport:open",
  transportExchange: "transport:exchange",
  transportClose: "transport:close",
  transportListen: "transport:listen",
  transportListenUnsubscribe: "transport:listen:unsubscribe",
  updater: "updater",
  deepLinking: "deep-linking",
  appReload: "app-reload",
  appRelaunch: "app-relaunch",
  appQuit: "app-quit",
  showApp: "show-app",
  saveLogs: "save-logs",
  exportOperations: "export-operations",
  savePng: "save-png",
  openUserDataDirectory: "openUserDataDirectory",
  keepScreenAwake: "activate-keep-screen-awake",
  releaseScreenAwake: "deactivate-keep-screen-awake",
  openExternal: "shell:open-external",
  clipboardWriteText: "clipboard:write-text",
  clipboardReadText: "clipboard:read-text",
  cardSessionBootstrap: "card-session:bootstrap",
  // Sent by the preload itself, outside the bridge.
  reloadRenderer: "reloadRenderer",
  webviewDomReady: "webview-dom-ready",
  setBackgroundColor: "set-background-color",
  readyToShow: "ready-to-show",
} as const;
