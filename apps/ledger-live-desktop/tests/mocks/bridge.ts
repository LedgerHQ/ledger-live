import {
  BOOTSTRAP_VERSION,
  type Bootstrap,
  type CardSessionBridge,
  type DbBridge,
  type DeeplinkBridge,
  type UpdaterBridge,
  type UpdaterStatusEvent,
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
  appDirname: "/tmp/ledger-live-test/app",
  distributionChannel: "direct",
  locale: { app: "en-US", system: "en-US" },
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

export const cardSession: CardSessionBridge = {
  takeBootstrap: async () => process.env.CARD_SESSION_BOOTSTRAP || null,
};
