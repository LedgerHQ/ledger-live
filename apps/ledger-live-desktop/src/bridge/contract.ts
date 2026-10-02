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

/**
 * The application database, owned by the main process.
 *
 * One named method per operation, with no channel parameter. A generic
 * `invoke(channel, ...args)` passthrough would be far less code, and would also hand any
 * script running in the renderer the entire main-process surface — including
 * `setEncryptionKey` and `isEncryptionKeyCorrect`, which together are an offline oracle
 * against the account database. Naming each operation keeps that surface reviewable and
 * lets the payloads stay typed.
 */
export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  /**
   * `value` must be JSON-safe. Account graphs contain BigNumber instances, which the
   * bridge would silently flatten, so callers encode before reaching this point.
   */
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

/**
 * Transport handlers resolve with a tagged union instead of rejecting, so failures arrive
 * as data. That is why these are typed as unions rather than as promises that throw.
 */
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

/**
 * Device transport, used only for Speculos and the HTTP proxy. Real devices talk WebHID
 * straight from the renderer and do not come through here.
 *
 * APDUs cross as hex strings: a Buffer would be flattened by the bridge's conversion.
 */
export type TransportBridge = {
  open(requestId: string, descriptor: string, timeout?: number): Promise<TransportOpenResult>;
  exchange(requestId: string, apduHex: string, timeout?: number): Promise<TransportExchangeResult>;
  close(requestId: string): Promise<{ type: "close-response"; requestId: string }>;
  listen(requestId: string): Promise<TransportListenResult>;
  listenUnsubscribe(
    requestId: string,
  ): Promise<{ type: "unsubscribe-response"; requestId: string }>;
};

/**
 * Removes a subscription created by one of the `on*` methods below.
 *
 * Subscriptions are cancelled through a returned closure rather than by passing the
 * listener back, because `removeListener(channel, fn)` cannot work across the bridge: the
 * renderer's function arrives in the preload as a proxy with a different identity, so the
 * lookup would silently fail and the listener would leak.
 */
export type Unsubscribe = () => void;

/**
 * Payload pushed by the auto-updater.
 *
 * `status` is kept as a plain string here rather than importing the renderer's
 * `UpdateStatus` union: this file is compiled into the preload bundle and must not pull in
 * renderer code. The consumer narrows it.
 */
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

/** Where a save dialog put the file, as returned by Electron. */
export type SaveTarget = { canceled: boolean; filePath?: string };

export type AppBridge = {
  reload(): void;
  relaunch(): void;
  quit(): void;
  show(): void;
};

export type DialogsBridge = {
  showSave(options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue>;
};

export type FilesBridge = {
  /**
   * `logsJson` is pre-stringified by the caller. The in-memory logs contain circular
   * references and typed arrays that neither the bridge nor Electron's IPC serialiser can
   * carry, so they are serialised with a custom replacer first — do not "simplify" this
   * into passing the array.
   */
  saveLogs(target: SaveTarget, logsJson: string): Promise<void>;
  exportOperations(target: SaveTarget, csv: string): Promise<boolean>;
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

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
  db: DbBridge;
  transport: TransportBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
  app: AppBridge;
  dialogs: DialogsBridge;
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
  showSaveDialog: "show-save-dialog",
  saveLogs: "save-logs",
  exportOperations: "export-operations",
  openUserDataDirectory: "openUserDataDirectory",
  keepScreenAwake: "activate-keep-screen-awake",
  releaseScreenAwake: "deactivate-keep-screen-awake",
  cardSessionBootstrap: "card-session:bootstrap",
} as const;
