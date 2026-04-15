import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import type { AleoSigner, AleoCoinConfig } from "../types";
import aleoCoinConfig from "../config";
import { buildCurrencyBridge, buildAccountBridge, createBridges } from "./index";

jest.mock("../config");

const mockAleoConfig = jest.mocked(aleoCoinConfig);

describe("Bridge", () => {
  const mockConfig = getMockedConfig("testnet");

  // Mock signer context that provides an AleoSigner
  const createMockSignerContext = (): SignerContext<AleoSigner> => {
    const signRootIntent = jest.fn().mockResolvedValue({ signature: "root-signature" });
    const signFeeIntent = jest.fn().mockResolvedValue({ signature: "fee-signature" });
    const getAddress = jest.fn().mockResolvedValue({ address: "aleo1test" });
    const getViewKey = jest.fn().mockResolvedValue({ viewKey: "view_key" });
    const getAppConfig = jest.fn().mockResolvedValue({});

    const mockSigner: AleoSigner = {
      signRootIntent,
      signFeeIntent,
      getAddress,
      getViewKey,
      getAppConfig,
    };

    return <T>(_deviceId: string, fn: (signer: AleoSigner) => Promise<T>): Promise<T> =>
      fn(mockSigner);
  };

  const createMockCoinConfig = (): CoinConfig<AleoCoinConfig> =>
    jest.fn().mockReturnValue(mockConfig);

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

      const result = await currencyBridge.preload(getMockedCurrency());

      expect(result).toEqual({});
    });

    it("hydrate should be a no-op function", () => {
      const signerContext = createMockSignerContext();
      const currencyBridge = buildCurrencyBridge(signerContext);

      const result = currencyBridge.hydrate({}, getMockedCurrency());
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

      // @ts-expect-error - only checking if it throws
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
