import type { Bootstrap, DbBridge } from "~/bridge/contract";

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
