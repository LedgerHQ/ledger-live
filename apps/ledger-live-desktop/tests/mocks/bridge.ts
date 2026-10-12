import {
  BOOTSTRAP_VERSION,
  type Bootstrap,
  type CardSessionBridge,
  type DbBridge,
  type DeeplinkBridge,
  type UpdaterBridge,
  type UpdaterStatusEvent,
  type AppBridge,
  type FilesBridge,
  type PowerBridge,
  type StoreBridge,
  type ShellBridge,
  type SystemBridge,
  type ZcashBridge,
} from "~/bridge/contract";

export const bootstrap: Bootstrap = {
  version: BOOTSTRAP_VERSION,
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

// `on*` must return an unsubscribe closure.
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
  clipboardMatchesText: jest.fn().mockResolvedValue(null),
  setVisualZoomLevelLimits: jest.fn(),
  getResourceUsage: jest.fn(() => undefined),
};

export const zcash: jest.Mocked<ZcashBridge> = {
  invoke: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn((_channel: string, _callback: (payload: unknown) => void) => () => {}),
};

export const cardSession: CardSessionBridge = {
  takeBootstrap: async () => process.env.CARD_SESSION_BOOTSTRAP || null,
};
