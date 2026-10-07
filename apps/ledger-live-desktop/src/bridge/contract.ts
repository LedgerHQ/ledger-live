// Bundled into the preload: keep it to types and constants.

/** Bump on every shape change of `LedgerBridge` or `Bootstrap` respectively. */
export const BRIDGE_VERSION = 3;
export const BOOTSTRAP_VERSION = 1;

export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

export type Bootstrap = {
  version: typeof BOOTSTRAP_VERSION;
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

export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  setKey(ns: string, keyPath: string, value: Serializable): Promise<void>;
  hasEncryptionKey(ns: string, keyPath: string): Promise<boolean>;
  /** `currentEncryptionKey` is required while a key is held: main rejects a rekey without it. */
  setEncryptionKey(encryptionKey: string, currentEncryptionKey?: string): Promise<void>;
  removeEncryptionKey(currentEncryptionKey?: string): Promise<void>;
  isEncryptionKeyCorrect(encryptionKey: string): Promise<boolean>;
  hasBeenDecrypted(): Promise<boolean>;
  resetAll(): Promise<void>;
  reload(): Promise<void>;
  cleanCache(): Promise<void>;
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
  /** Pre-stringified: the logs hold circular references the bridge cannot carry. */
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

/** Its own group, so the lint guardrail matching on a `shell` object still sees the facade. */
export type ShellBridge = {
  openExternal(url: string): void;
};

export type SystemBridge = {
  /** Compared in main so renderer code never reads the clipboard; null when it cannot be read. */
  clipboardMatchesText(expected: string): Promise<boolean | null>;
  setVisualZoomLevelLimits(minimum: number, maximum: number): void;
  getResourceUsage(): Electron.ResourceUsage | undefined;
};

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type LedgerBridge = {
  version: typeof BRIDGE_VERSION;
  bootstrap: Bootstrap;
  shell: ShellBridge;
  system: SystemBridge;
  db: DbBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
  app: AppBridge;
  dialogs: DialogsBridge;
  files: FilesBridge;
  power: PowerBridge;
  store: StoreBridge;
  cardSession: CardSessionBridge;
};

// Every channel is listed here: a generic invoke passthrough would expose all of main,
// including setEncryptionKey + isEncryptionKeyCorrect, an offline oracle on the account db.
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
  openExternal: "shell:open-external",
  clipboardMatchesText: "clipboard:matches-text",
  cardSessionBootstrap: "card-session:bootstrap",
} as const;
