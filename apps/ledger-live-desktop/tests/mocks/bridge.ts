import type {
  Bootstrap,
  DbBridge,
  DeeplinkBridge,
  TransportBridge,
  UpdaterBridge,
  UpdaterStatusEvent,
  AppBridge,
  FilesBridge,
  PowerBridge,
  StoreBridge,
  ShellBridge,
  SystemBridge,
  ZcashBridge,
} from "~/bridge/contract";

/**
 * Test double for `~/renderer/bridge`, which reads `window.lld` — provided only by the
 * preload. Mapped in jest.config.js, so test files need not know what sits behind it.
 */
export const bootstrap: Bootstrap = {
  version: 1,
  env: { ...process.env },
  os: {
    type: "Darwin",
    release: "23.0.0",
    platform: "darwin",
    hostname: "test-host",
  },
  paths: {
    userData: "/tmp/ledger-live-test/userdata",
    home: "/tmp/ledger-live-test/home",
  },
  distributionChannel: "direct",
  store: {},
};

export const db: jest.Mocked<DbBridge> = {
  getKey: jest.fn().mockResolvedValue(undefined),
  setKey: jest.fn().mockResolvedValue(undefined),
  hasEncryptionKey: jest.fn().mockResolvedValue(false),
  setEncryptionKey: jest.fn().mockResolvedValue(undefined),
  removeEncryptionKey: jest.fn().mockResolvedValue(undefined),
  isEncryptionKeyCorrect: jest.fn().mockResolvedValue(true),
  hasBeenDecrypted: jest.fn().mockResolvedValue(true),
  resetAll: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined),
  cleanCache: jest.fn().mockResolvedValue(undefined),
};

// Every method resolves: callers chain `.catch()`, so a bare `undefined` would throw.
export const transport: jest.Mocked<TransportBridge> = {
  open: jest.fn().mockResolvedValue(undefined),
  exchange: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  listen: jest.fn().mockResolvedValue(undefined),
  listenUnsubscribe: jest.fn().mockResolvedValue(undefined),
};

// `on*` doubles must return a closure: consumers call the result on unmount.
export const updater: jest.Mocked<UpdaterBridge> = {
  init: jest.fn(),
  quitAndInstall: jest.fn(),
  onStatus: jest.fn((_callback: (event: UpdaterStatusEvent) => void) => () => {}),
};

export const deeplink: jest.Mocked<DeeplinkBridge> = {
  open: jest.fn(),
  onOpen: jest.fn((_callback: (url: string) => void) => () => {}),
};

export const app: jest.Mocked<AppBridge> = {
  reload: jest.fn(),
  relaunch: jest.fn(),
  quit: jest.fn(),
  show: jest.fn(),
};

export const files: jest.Mocked<FilesBridge> = {
  saveLogs: jest.fn().mockResolvedValue("saved"),
  exportOperations: jest.fn().mockResolvedValue("saved"),
  savePng: jest.fn().mockResolvedValue("saved"),
  openUserDataDirectory: jest.fn().mockResolvedValue(undefined),
  readLocalManifest: jest.fn().mockResolvedValue(null),
  writeLocalManifest: jest.fn().mockResolvedValue(false),
  readDotEnvFile: jest.fn().mockResolvedValue(null),
};

export const power: jest.Mocked<PowerBridge> = {
  keepScreenAwake: jest.fn().mockResolvedValue(1),
  release: jest.fn().mockResolvedValue(undefined),
};

export const store: jest.Mocked<StoreBridge> = {
  set: jest.fn(),
  clear: jest.fn(),
};

export const shell: jest.Mocked<ShellBridge> = {
  openExternal: jest.fn(),
};

export const system: jest.Mocked<SystemBridge> = {
  clipboardWriteText: jest.fn(),
  clipboardReadText: jest.fn().mockResolvedValue(null),
  setVisualZoomLevelLimits: jest.fn(),
  getResourceUsage: jest.fn(() => undefined),
};

export const zcash: jest.Mocked<ZcashBridge> = {
  invoke: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn((_channel: string, _callback: (payload: unknown) => void) => () => {}),
};
