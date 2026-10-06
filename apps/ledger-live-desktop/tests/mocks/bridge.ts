import {
  BOOTSTRAP_VERSION,
  type Bootstrap,
  type CardSessionBridge,
  type DbBridge,
  type TransportBridge,
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

// Must resolve: callers chain `.catch()`.
export const transport: jest.Mocked<TransportBridge> = {
  open: jest.fn().mockResolvedValue(undefined),
  exchange: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  listen: jest.fn().mockResolvedValue(undefined),
  listenUnsubscribe: jest.fn().mockResolvedValue(undefined),
};

export const cardSession: CardSessionBridge = {
  takeBootstrap: async () => process.env.CARD_SESSION_BOOTSTRAP || null,
};
