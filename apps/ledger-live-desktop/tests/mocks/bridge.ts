import type {
  Bootstrap,
  DbBridge,
  DeeplinkBridge,
  TransportBridge,
  UpdaterBridge,
  UpdaterStatusEvent,
  AppBridge,
  DialogsBridge,
  FilesBridge,
  PowerBridge,
  StoreBridge,
  ShellBridge,
  SystemBridge,
  ZcashBridge,
} from "~/bridge/contract";

/**
 * Test double for `~/renderer/bridge`.
 *
 * The real module reads `window.ledger`, which only the preload script provides, so tests
 * substitute this instead. Mapping the one module means test files do not have to know
 * which IPC channels or Electron APIs sit behind the bridge.
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
  appDirname: "/tmp/ledger-live-test/app",
  distributionChannel: "direct",
  locale: { app: "en-US", system: "en-US" },
  store: {},
};

/**
 * Database calls resolve to `undefined` by default, matching how the previous
 * `ipcRenderer` mock behaved. Tests that care override individual methods.
 */
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

/**
 * Every method resolves by default. Callers chain `.catch()` on these, so returning
 * `undefined` would throw rather than simply doing nothing — the old catch-all
 * `ipcRenderer.invoke` mock resolved for any channel, and this preserves that.
 */
export const transport: jest.Mocked<TransportBridge> = {
  open: jest.fn().mockResolvedValue(undefined),
  exchange: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  listen: jest.fn().mockResolvedValue(undefined),
  listenUnsubscribe: jest.fn().mockResolvedValue(undefined),
};

/**
 * `on*` methods return an unsubscribe closure, so the doubles must return one too —
 * consumers call the result on unmount and would otherwise crash.
 */
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

export const dialogs: jest.Mocked<DialogsBridge> = {
  showSave: jest.fn().mockResolvedValue({ canceled: true }),
  showOpen: jest.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
};

export const files: jest.Mocked<FilesBridge> = {
  saveLogs: jest.fn().mockResolvedValue(undefined),
  exportOperations: jest.fn().mockResolvedValue(true),
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
