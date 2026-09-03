/**
 * The contract between the preload script and the renderer, imported by both so the
 * compiler enforces that they agree.
 *
 * Keep it type-only plus the channel constants: it is pulled into the preload bundle, which
 * must stay free of Node and renderer code.
 */

/** Values that survive the context bridge's structured-clone-like conversion. */
export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * Captured in main and handed to the renderer before any of its code runs: renderer modules
 * read `process.env` and `os` at module scope, which async IPC cannot satisfy.
 */
export type Bootstrap = {
  /** Bumped whenever this shape changes, so a stale preload is detected rather than misread. */
  version: 1;
  /**
   * Deliberately unfiltered: consumers read keys that are not `@ledgerhq/live-env` names
   * (HIDE_DEBUG_MOCK, LEDGER_MIN_HEIGHT, the NO_DEBUG_* family, DEFAULT_*_MANIFEST_ID), and
   * the E2E suites pass arbitrary variables through `electron.launch({ env })`.
   */
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
  /** Contents of the `lld.json` store, hydrated so renderer reads can stay synchronous. */
  store: Record<string, unknown>;
};

/**
 * One named method per operation, and no channel parameter anywhere in this file. A generic
 * `invoke(channel, ...args)` passthrough would hand any script running in the renderer the
 * whole main-process surface — including `setEncryptionKey` and `isEncryptionKeyCorrect`,
 * which together are an offline oracle against the account database.
 */
export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  /**
   * `value` must be JSON-safe. Account graphs contain BigNumber instances, which the bridge
   * silently flattens, so callers encode before reaching this point.
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

/** Transport handlers resolve with a tagged union instead of rejecting: failures are data. */
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
 * Device transport, used only for Speculos and the HTTP proxy — real devices talk WebHID
 * straight from the renderer. APDUs cross as hex: a Buffer is flattened by the conversion.
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
 * Cancels a subscription. A closure rather than `removeListener(channel, fn)`, which cannot
 * work across the bridge: the renderer's function arrives in the preload as a proxy with a
 * different identity, so removal would silently no-op and the listener would leak.
 */
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

/**
 * A request to write a file. Main runs the save dialog itself and keeps the resulting path,
 * so the renderer never learns one.
 */
export type SaveRequest = {
  options: Electron.SaveDialogOptions;
  /** Fixed path for the E2E suites. Honoured only when PLAYWRIGHT_RUN is set in main. */
  e2ePath?: string;
};

/** Cancelling is not a failure, and callers surface the two differently. */
export type SaveOutcome = "saved" | "canceled" | "failed";

export type AppBridge = {
  reload(): void;
  relaunch(): void;
  quit(): void;
  /** Brings the main window forward, e.g. when a Live App needs user attention. */
  show(): void;
};

export type FilesBridge = {
  /**
   * `logsJson` is pre-stringified with a custom replacer, because the in-memory logs hold
   * circular references and typed arrays that neither the bridge nor Electron's IPC
   * serialiser can carry. Do not "simplify" this into passing the array.
   */
  saveLogs(request: SaveRequest, logsJson: string): Promise<SaveOutcome>;
  exportOperations(request: SaveRequest, csv: string): Promise<SaveOutcome>;
  savePng(options: Electron.SaveDialogOptions, base64: string): Promise<SaveOutcome>;
  openUserDataDirectory(): Promise<unknown>;
  readLocalManifest(): Promise<string | null>;
  writeLocalManifest(defaultName: string, contents: string): Promise<boolean>;
  readDotEnvFile(environment: string): Promise<string | null>;
};

export type PowerBridge = {
  /** Returns a blocker id to pass back to {@link release}. */
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
  /** Resolves null when the clipboard cannot be read, which is distinct from empty. */
  clipboardReadText(): Promise<string | null>;
  setVisualZoomLevelLimits(minimum: number, maximum: number): void;
  getResourceUsage(): Electron.ResourceUsage | undefined;
};

/**
 * The one place a channel name is a parameter. Safe only because the preload validates
 * every channel against `@ledgerhq/coin-zcash`'s own closed `ZCASH_IPC` list.
 */
export type ZcashBridge = {
  invoke(channel: string, args: unknown): Promise<unknown>;
  subscribe(channel: string, callback: (payload: unknown) => void): Unsubscribe;
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
};

/** Every IPC channel name lives here, and nowhere else. */
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
  /** Bidirectional: the renderer both sends and listens on this name. */
  updater: "updater",
  /** Bidirectional: main pushes incoming links, the renderer sends outgoing ones. */
  deepLinking: "deep-linking",
  appReload: "app-reload",
  appRelaunch: "app-relaunch",
  appQuit: "app-quit",
  showApp: "show-app",
  saveLogs: "save-logs",
  exportOperations: "export-operations",
  savePng: "save-png",
  openUserDataDirectory: "openUserDataDirectory",
  readLocalManifest: "read-local-manifest",
  writeLocalManifest: "write-local-manifest",
  readDotEnvFile: "read-dotenv-file",
  keepScreenAwake: "activate-keep-screen-awake",
  releaseScreenAwake: "deactivate-keep-screen-awake",
  openExternal: "shell:open-external",
  clipboardWriteText: "clipboard:write-text",
  clipboardReadText: "clipboard:read-text",
} as const;
