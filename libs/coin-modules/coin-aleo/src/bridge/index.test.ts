import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CoinConfig } from "@ledgerhq/coin-framework/config";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import type { AleoSigner } from "../types";
import type { AleoCoinConfig } from "../config";
import aleoCoinConfig from "../config";
import { buildCurrencyBridge, buildAccountBridge, createBridges } from "./index";

jest.mock("../config");

const mockAleoConfig = jest.mocked(aleoCoinConfig);

describe("Bridge", () => {
  const mockConfig = getMockedConfig("testnet");

  // Mock signer context that provides an AleoSigner
  const createMockSignerContext = (): SignerContext<AleoSigner> => {
    const signTransaction = jest.fn().mockResolvedValue(Buffer.from("signature"));
    const getAddress = jest.fn().mockResolvedValue(Buffer.from("aleo1test"));
    const getViewKey = jest.fn().mockResolvedValue(Buffer.from("view_key"));

    const mockSigner: AleoSigner = {
      signTransaction,
      getAddress,
      getViewKey,
    };

    return <T>(_deviceId: string, fn: (signer: AleoSigner) => Promise<T>): Promise<T> =>
      fn(mockSigner);
  };

  const createMockCoinConfig = (): CoinConfig<AleoCoinConfig> => ({
    getCoinConfig: jest.fn().mockReturnValue(mockConfig),
    setCoinConfig: jest.fn(),
  });

  describe("buildCurrencyBridge", () => {
    it("should return a currency bridge with preload, hydrate, and scanAccounts methods", () => {
      const signerContext = createMockSignerContext();
      const currencyBridge = buildCurrencyBridge(signerContext);

      expect(currencyBridge.preload).toBeInstanceOf(Function);
      expect(currencyBridge.hydrate).toBeInstanceOf(Function);
      expect(currencyBridge.scanAccounts).toBeInstanceOf(Function);
    });

    it("should preload successfully", async () => {
      const signerContext = createMockSignerContext();
      const currencyBridge = buildCurrencyBridge(signerContext);

      const result = await currencyBridge.preload();

      expect(result).toEqual({});
    });

    it("hydrate should be a no-op function", () => {
      const signerContext = createMockSignerContext();
      const currencyBridge = buildCurrencyBridge(signerContext);

      // Should not throw and return undefined
      const result = currencyBridge.hydrate();
      expect(result).toBeUndefined();
    });
  });

  describe("buildAccountBridge", () => {
    it("should return an account bridge with required methods", () => {
      const signerContext = createMockSignerContext();
      const accountBridge = buildAccountBridge(signerContext);

      expect(accountBridge.createTransaction).toBeInstanceOf(Function);
      expect(accountBridge.updateTransaction).toBeInstanceOf(Function);
      expect(accountBridge.prepareTransaction).toBeInstanceOf(Function);
      expect(accountBridge.getTransactionStatus).toBeInstanceOf(Function);
      expect(accountBridge.sync).toBeInstanceOf(Function);
      expect(accountBridge.receive).toBeInstanceOf(Function);
      expect(accountBridge.signOperation).toBeInstanceOf(Function);
      expect(accountBridge.signRawOperation).toBeInstanceOf(Function);
      expect(accountBridge.broadcast).toBeInstanceOf(Function);
      expect(accountBridge.estimateMaxSpendable).toBeInstanceOf(Function);
      expect(accountBridge.assignFromAccountRaw).toBeInstanceOf(Function);
      expect(accountBridge.assignToAccountRaw).toBeInstanceOf(Function);
      expect(accountBridge.getSerializedAddressParameters).toBeInstanceOf(Function);
      expect(accountBridge.validateAddress).toBeInstanceOf(Function);
    });

    it("signRawOperation should throw unsupported error", () => {
      const signerContext = createMockSignerContext();
      const accountBridge = buildAccountBridge(signerContext);

      expect(() => accountBridge.signRawOperation()).toThrow("signRawOperation is not supported");
    });

    it("createTransaction should return a transaction", () => {
      const signerContext = createMockSignerContext();
      const accountBridge = buildAccountBridge(signerContext);
      const mockAccount = getMockedAccount();
      const tx = accountBridge.createTransaction(mockAccount);

      expect(tx).toHaveProperty("family", "aleo");
    });

    it("updateTransaction should update transaction", () => {
      const signerContext = createMockSignerContext();
      const accountBridge = buildAccountBridge(signerContext);
      const mockAccount = getMockedAccount();
      const tx = accountBridge.createTransaction(mockAccount);
      const updated = accountBridge.updateTransaction(tx, {
        recipient: "aleo1newrecipient",
      });

      expect(updated).toHaveProperty("recipient", "aleo1newrecipient");
    });
  });

  describe("createBridges", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return both currency and account bridges", () => {
      const signerContext = createMockSignerContext();
      const mockCoinConfig = createMockCoinConfig();
      const bridges = createBridges(signerContext, mockCoinConfig);

      expect(mockAleoConfig.setCoinConfig).toHaveBeenCalledTimes(1);
      expect(mockAleoConfig.setCoinConfig).toHaveBeenCalledWith(mockCoinConfig);
      expect(bridges.currencyBridge).toBeInstanceOf(Object);
      expect(bridges.accountBridge).toBeInstanceOf(Object);
    });

    it("currency bridge should have preload, hydrate, and scanAccounts", () => {
      const signerContext = createMockSignerContext();
      const mockCoinConfig = createMockCoinConfig();
      const bridges = createBridges(signerContext, mockCoinConfig);

      expect(bridges.currencyBridge.preload).toBeInstanceOf(Function);
      expect(bridges.currencyBridge.hydrate).toBeInstanceOf(Function);
      expect(bridges.currencyBridge.scanAccounts).toBeInstanceOf(Function);
    });

    it("account bridge should have required methods", () => {
      const signerContext = createMockSignerContext();
      const mockCoinConfig = createMockCoinConfig();
      const bridges = createBridges(signerContext, mockCoinConfig);

      expect(bridges.accountBridge.createTransaction).toBeInstanceOf(Function);
      expect(bridges.accountBridge.updateTransaction).toBeInstanceOf(Function);
      expect(bridges.accountBridge.prepareTransaction).toBeInstanceOf(Function);
      expect(bridges.accountBridge.getTransactionStatus).toBeInstanceOf(Function);
      expect(bridges.accountBridge.sync).toBeInstanceOf(Function);
      expect(bridges.accountBridge.receive).toBeInstanceOf(Function);
      expect(bridges.accountBridge.estimateMaxSpendable).toBeInstanceOf(Function);
    });
  });
});
