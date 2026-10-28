// Bundled into the preload: keep it to types and constants.

import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";

/** Bump on every shape change of `LedgerBridge` or `Bootstrap` respectively. */
export const BRIDGE_VERSION = 8;
export const BOOTSTRAP_VERSION = 2;

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
  distributionChannel: "mac-app-store" | "windows-store" | "direct";
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

/** The Live App <webview> preload channels: Wallet API / Platform API, and the dapp provider. */
export const WEBVIEW_BRIDGE_CHANNELS = ["webviewToParent", "dappToParent"] as const;
export type WebviewBridgeChannel = (typeof WEBVIEW_BRIDGE_CHANNELS)[number];

/** A Live App message that main accepted: sent by the guest main frame, on an allowed origin. */
export type WebviewBridgeMessage = {
  /** WebContents id of the <webview> guest */
  guestId: number;
  /** Origin of the guest main frame when it sent the message, as seen by main */
  origin: string;
  channel: WebviewBridgeChannel;
  message: unknown;
};

export type WebviewBridge = {
  /** Live App domain check violations seen by main, once per guest, origin and outcome. */
  onDomainCheckViolation(callback: (violation: DomainCheckViolation) => void): Unsubscribe;
  /** Live App bridge messages that main accepted, for the guest's embedder. */
  onMessage(callback: (message: WebviewBridgeMessage) => void): Unsubscribe;
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
  /** Compared in main so renderer code never reads the clipboard; null when it cannot be read. */
  clipboardMatchesText(expected: string): Promise<boolean | null>;
  setVisualZoomLevelLimits(minimum: number, maximum: number): void;
  getResourceUsage(): Electron.ResourceUsage | undefined;
};

export type ZcashBridge = {
  invoke(channel: string, args: unknown): Promise<unknown>;
  subscribe(channel: string, callback: (payload: unknown) => void): Unsubscribe;
};

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type BluetoothDeviceCandidate = { deviceId: string; deviceName: string };

export type BluetoothSelectionRequest = {
  requestId: number;
  devices: BluetoothDeviceCandidate[];
};

export type BluetoothPairingKind = "confirmPin" | "providePin";

export type BluetoothPairingRequest = {
  requestId: number;
  deviceId: string;
  pairingKind: BluetoothPairingKind;
  /** The pin to compare with the device screen, for `confirmPin`. */
  pin?: string;
};

export type BluetoothPairingResponse = { confirmed: boolean; pin?: string };

/** Backs the in-app Web Bluetooth chooser and the Windows/Linux pairing prompt. */
export type BluetoothBridge = {
  /** Fired (again, with the growing list) while a navigator.bluetooth.requestDevice scan runs. */
  onSelectionRequest(callback: (request: BluetoothSelectionRequest) => void): Unsubscribe;
  /** Fired when the pending selection request ended (selected, cancelled or timed out). */
  onSelectionEnd(callback: (requestId: number) => void): Unsubscribe;
  /** deviceId must be one of the candidates of that request; null cancels. */
  selectDevice(requestId: number, deviceId: string | null): void;
  onPairingRequest(callback: (request: BluetoothPairingRequest) => void): Unsubscribe;
  respondToPairing(requestId: number, response: BluetoothPairingResponse): void;
};

export type LedgerBridge = {
  version: typeof BRIDGE_VERSION;
  bootstrap: Bootstrap;
  shell: ShellBridge;
  system: SystemBridge;
  zcash: ZcashBridge;
  db: DbBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
  webview: WebviewBridge;
  app: AppBridge;
  files: FilesBridge;
  power: PowerBridge;
  store: StoreBridge;
  cardSession: CardSessionBridge;
  bluetooth: BluetoothBridge;
};

/** Main refuses a pending Bluetooth pairing after this delay; the renderer dialog closes too. */
export const BLUETOOTH_PAIRING_TIMEOUT_MS = 60_000;
/** A Bluetooth passkey is 6 decimal digits. */
export const BLUETOOTH_PASSKEY_PATTERN = /^\d{6}$/;

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
  webviewDomainCheckViolation: "webview:domain-check-violation",
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
  clipboardMatchesText: "clipboard:matches-text",
  cardSessionBootstrap: "card-session:bootstrap",
  // Live App <webview> guest -> main, then main -> the guest's embedder.
  webviewBridgeMessage: "webview-bridge:message",
  bluetoothSelectionRequest: "bluetooth:selection-request",
  bluetoothSelectionEnd: "bluetooth:selection-end",
  bluetoothSelectDevice: "bluetooth:select-device",
  bluetoothPairingRequest: "bluetooth:pairing-request",
  bluetoothPairingResponse: "bluetooth:pairing-response",
  // Sent by the preload itself, outside the bridge.
  reloadRenderer: "reloadRenderer",
  setBackgroundColor: "set-background-color",
  readyToShow: "ready-to-show",
} as const;
