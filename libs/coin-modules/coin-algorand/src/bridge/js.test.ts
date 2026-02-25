import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AlgorandSigner } from "../signer";
import { buildCurrencyBridge, buildAccountBridge, createBridges } from "./js";

// Mock all dependencies
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  makeAccountBridgeReceive: jest.fn().mockReturnValue(jest.fn()),
  makeScanAccounts: jest.fn().mockReturnValue(jest.fn()),
  updateTransaction: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/bridge/getAddressWrapper", () => jest.fn(fn => fn));

jest.mock("../estimateMaxSpendable", () => ({
  estimateMaxSpendable: jest.fn(),
}));

jest.mock("../formatters", () => ({
  default: {
    formatAccountSpecifics: jest.fn(),
    formatOperationSpecifics: jest.fn(),
  },
}));

jest.mock("../getTransactionStatus", () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock("../synchronization", () => ({
  getAccountShape: jest.fn(),
  sync: jest.fn(),
}));

jest.mock("../prepareTransaction", () => ({
  prepareTransaction: jest.fn(),
}));

jest.mock("../createTransaction", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("../signOperation", () => ({
  buildSignOperation: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("../initAccount", () => ({
  initAccount: jest.fn(),
}));

jest.mock("../broadcast", () => ({
  broadcast: jest.fn(),
}));

jest.mock("../hw-getAddress", () => jest.fn().mockReturnValue(jest.fn()));

jest.mock("../serialization", () => ({
  assignFromAccountRaw: jest.fn(),
  assignToAccountRaw: jest.fn(),
  fromOperationExtraRaw: jest.fn(),
  toOperationExtraRaw: jest.fn(),
}));

jest.mock("../validateAddress", () => ({
  validateAddress: jest.fn(),
}));

describe("bridge/js", () => {
  const mockSignerContext = {} as SignerContext<AlgorandSigner>;

  describe("buildCurrencyBridge", () => {
    it("should build a currency bridge with required methods", () => {
      const bridge = buildCurrencyBridge(mockSignerContext);

      expect(bridge).toHaveProperty("preload");
      expect(bridge).toHaveProperty("hydrate");
      expect(bridge).toHaveProperty("scanAccounts");
      expect(typeof bridge.preload).toBe("function");
      expect(typeof bridge.hydrate).toBe("function");
      expect(typeof bridge.scanAccounts).toBe("function");
    });

    it("preload should resolve to empty object", async () => {
      const bridge = buildCurrencyBridge(mockSignerContext);

      const result = await bridge.preload();

      expect(result).toEqual({});
    });

    it("hydrate should be callable", () => {
      const bridge = buildCurrencyBridge(mockSignerContext);

      expect(() => bridge.hydrate()).not.toThrow();
    });
  });

  describe("buildAccountBridge", () => {
    it("should build an account bridge with required methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("createTransaction");
      expect(bridge).toHaveProperty("updateTransaction");
      expect(bridge).toHaveProperty("prepareTransaction");
      expect(bridge).toHaveProperty("getTransactionStatus");
      expect(bridge).toHaveProperty("sync");
      expect(bridge).toHaveProperty("receive");
      expect(bridge).toHaveProperty("signOperation");
      expect(bridge).toHaveProperty("broadcast");
      expect(bridge).toHaveProperty("estimateMaxSpendable");
    });

    it("should include serialization methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("assignToAccountRaw");
      expect(bridge).toHaveProperty("assignFromAccountRaw");
      expect(bridge).toHaveProperty("fromOperationExtraRaw");
      expect(bridge).toHaveProperty("toOperationExtraRaw");
    });

    it("should include formatting methods", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("formatAccountSpecifics");
      expect(bridge).toHaveProperty("formatOperationSpecifics");
    });

    it("should include address validation", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(bridge).toHaveProperty("validateAddress");
    });

    it("signRawOperation should throw not supported error", () => {
      const bridge = buildAccountBridge(mockSignerContext);

      expect(() => bridge.signRawOperation()).toThrow("signRawOperation is not supported");
    });
  });

  describe("createBridges", () => {
    it("should return both currency and account bridges", () => {
      const bridges = createBridges(mockSignerContext);

      expect(bridges).toHaveProperty("currencyBridge");
      expect(bridges).toHaveProperty("accountBridge");
    });

    it("should return valid currency bridge", () => {
      const { currencyBridge } = createBridges(mockSignerContext);

      expect(currencyBridge).toHaveProperty("preload");
      expect(currencyBridge).toHaveProperty("hydrate");
      expect(currencyBridge).toHaveProperty("scanAccounts");
    });

    it("should return valid account bridge", () => {
      const { accountBridge } = createBridges(mockSignerContext);

      expect(accountBridge).toHaveProperty("createTransaction");
      expect(accountBridge).toHaveProperty("broadcast");
      expect(accountBridge).toHaveProperty("estimateMaxSpendable");
    });
  });
});
