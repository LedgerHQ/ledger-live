import { buildCurrencyBridge, buildAccountBridge, createBridges } from "./js";

// Mock all dependencies
jest.mock("@ledgerhq/coin-framework/bridge/getAddressWrapper", () => ({
  __esModule: true,
  default: jest.fn((getAddress) => getAddress),
}));

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  updateTransaction: jest.fn(),
  makeAccountBridgeReceive: jest.fn(() => jest.fn()),
  makeScanAccounts: jest.fn(() => jest.fn()),
}));

jest.mock("../broadcast", () => ({
  broadcast: jest.fn(),
}));

jest.mock("../createTransaction", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("../estimateMaxSpendable", () => ({
  estimateMaxSpendable: jest.fn(),
}));

jest.mock("../formatters", () => ({
  __esModule: true,
  default: {
    formatAccountSpecifics: jest.fn(),
    formatOperationSpecifics: jest.fn(),
  },
}));

jest.mock("../getTransactionStatus", () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock("../hw-getAddress", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

jest.mock("../preload", () => ({
  getPreloadStrategy: jest.fn(),
  hydrate: jest.fn(),
  preload: jest.fn(),
}));

jest.mock("../prepareTransaction", () => ({
  prepareTransaction: jest.fn(),
}));

jest.mock("../serialization", () => ({
  assignFromAccountRaw: jest.fn(),
  assignToAccountRaw: jest.fn(),
  fromOperationExtraRaw: jest.fn(),
  toOperationExtraRaw: jest.fn(),
}));

jest.mock("../signOperation", () => ({
  buildSignOperation: jest.fn(() => jest.fn()),
}));

jest.mock("../synchronisation", () => ({
  getAccountShape: jest.fn(),
  sync: jest.fn(),
}));

jest.mock("../validateAddress", () => ({
  validateAddress: jest.fn(),
}));

describe("bridge/js", () => {
  const mockSignerContext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildCurrencyBridge", () => {
    it("returns a CurrencyBridge with required methods", () => {
      const bridge = buildCurrencyBridge(mockSignerContext);

      expect(bridge).toHaveProperty("getPreloadStrategy");
      expect(bridge).toHaveProperty("preload");
      expect(bridge).toHaveProperty("hydrate");
      expect(bridge).toHaveProperty("scanAccounts");
    });

    it("scanAccounts is a function", () => {
      const bridge = buildCurrencyBridge(mockSignerContext);

      expect(typeof bridge.scanAccounts).toBe("function");
    });
  });

  describe("buildAccountBridge", () => {
    it("returns an AccountBridge with required methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("estimateMaxSpendable");
      expect(bridge).toHaveProperty("createTransaction");
      expect(bridge).toHaveProperty("updateTransaction");
      expect(bridge).toHaveProperty("getTransactionStatus");
      expect(bridge).toHaveProperty("prepareTransaction");
      expect(bridge).toHaveProperty("sync");
      expect(bridge).toHaveProperty("receive");
      expect(bridge).toHaveProperty("signOperation");
      expect(bridge).toHaveProperty("signRawOperation");
      expect(bridge).toHaveProperty("broadcast");
    });

    it("signRawOperation throws not supported error", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(() => bridge.signRawOperation()).toThrow("signRawOperation is not supported");
    });

    it("has serialization methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("assignFromAccountRaw");
      expect(bridge).toHaveProperty("assignToAccountRaw");
      expect(bridge).toHaveProperty("fromOperationExtraRaw");
      expect(bridge).toHaveProperty("toOperationExtraRaw");
    });

    it("has formatter methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("formatAccountSpecifics");
      expect(bridge).toHaveProperty("formatOperationSpecifics");
    });

    it("has validation methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("validateAddress");
      expect(bridge).toHaveProperty("getSerializedAddressParameters");
    });
  });

  describe("createBridges", () => {
    it("returns both currency and account bridges", () => {
      const bridges = createBridges(mockSignerContext);

      expect(bridges).toHaveProperty("currencyBridge");
      expect(bridges).toHaveProperty("accountBridge");
    });

    it("currencyBridge has required methods", () => {
      const { currencyBridge } = createBridges(mockSignerContext);

      expect(currencyBridge).toHaveProperty("getPreloadStrategy");
      expect(currencyBridge).toHaveProperty("preload");
      expect(currencyBridge).toHaveProperty("hydrate");
      expect(currencyBridge).toHaveProperty("scanAccounts");
    });

    it("accountBridge has required methods", () => {
      const { accountBridge } = createBridges(mockSignerContext);

      expect(accountBridge).toHaveProperty("estimateMaxSpendable");
      expect(accountBridge).toHaveProperty("createTransaction");
      expect(accountBridge).toHaveProperty("broadcast");
    });
  });
});
