import type { CoinConfig } from "@ledgerhq/coin-framework/config";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { SuiCoinConfig } from "../config";
import suiConfig from "../config";
import { getAddress as signerGetAddress } from "../signer";
import type { SuiAccount, SuiSigner, Transaction, TransactionStatus } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { fromOperationExtraRaw, toOperationExtraRaw } from "./formatters";
import { getTransactionStatus } from "./getTransactionStatus";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { prepareTransaction } from "./prepareTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, sync } from "./synchronisation";
import { createBridges } from "./index";

// Mock all dependencies
jest.mock("../config");
jest.mock("../signer");
jest.mock("./signOperation");
jest.mock("./synchronisation");
jest.mock("./broadcast");
jest.mock("./createTransaction");
jest.mock("./estimateMaxSpendable");
jest.mock("./getTransactionStatus");
jest.mock("./preload");
jest.mock("./prepareTransaction");
jest.mock("./serialization");
jest.mock("./formatters");

const mockSuiConfig = suiConfig as jest.Mocked<typeof suiConfig>;
const mockSignerGetAddress = signerGetAddress as jest.MockedFunction<typeof signerGetAddress>;
const mockBuildSignOperation = buildSignOperation as jest.MockedFunction<typeof buildSignOperation>;
const mockGetAccountShape = getAccountShape as jest.MockedFunction<typeof getAccountShape>;
const mockSync = sync as jest.MockedFunction<typeof sync>;
const mockBroadcast = broadcast as jest.MockedFunction<typeof broadcast>;
const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockEstimateMaxSpendable = estimateMaxSpendable as jest.MockedFunction<
  typeof estimateMaxSpendable
>;
const mockGetTransactionStatus = getTransactionStatus as jest.MockedFunction<
  typeof getTransactionStatus
>;
const mockGetPreloadStrategy = getPreloadStrategy as jest.MockedFunction<typeof getPreloadStrategy>;
const mockHydrate = hydrate as jest.MockedFunction<typeof hydrate>;
const mockPreload = preload as jest.MockedFunction<typeof preload>;
const mockPrepareTransaction = prepareTransaction as jest.MockedFunction<typeof prepareTransaction>;
const mockAssignFromAccountRaw = assignFromAccountRaw as jest.MockedFunction<
  typeof assignFromAccountRaw
>;
const mockAssignToAccountRaw = assignToAccountRaw as jest.MockedFunction<typeof assignToAccountRaw>;
const mockFromOperationExtraRaw = fromOperationExtraRaw as jest.MockedFunction<
  typeof fromOperationExtraRaw
>;
const mockToOperationExtraRaw = toOperationExtraRaw as jest.MockedFunction<
  typeof toOperationExtraRaw
>;

describe("bridge/index", () => {
  let mockSignerContext: SignerContext<SuiSigner>;
  let mockCoinConfig: CoinConfig<SuiCoinConfig>;
  let mockCurrency: CryptoCurrency;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock signer context
    mockSignerContext = jest.fn() as any;

    // Setup mock coin config as a function
    mockCoinConfig = jest.fn(() => ({
      node: { url: "http://localhost:1234" },
      status: { type: "active" },
    })) as any;

    // Setup mock currency
    mockCurrency = {
      id: "sui",
      name: "Sui",
      family: "sui",
      units: [],
      type: "CryptoCurrency",
      ticker: "SUI",
      managerAppName: "Sui",
      coinType: 784,
      scheme: "sui",
      color: "#000000",
      explorerViews: [],
    } as CryptoCurrency;

    // Setup mock functions
    mockSignerGetAddress.mockReturnValue(jest.fn());
    mockBuildSignOperation.mockReturnValue(jest.fn());
    mockGetAccountShape.mockResolvedValue({} as any);
    mockSync.mockReturnValue({} as any);
    mockBroadcast.mockResolvedValue({} as any);
    mockCreateTransaction.mockReturnValue({} as any);
    mockEstimateMaxSpendable.mockResolvedValue(new BigNumber("1000000"));
    mockGetTransactionStatus.mockReturnValue({} as any);
    mockGetPreloadStrategy.mockReturnValue({} as any);
    mockHydrate.mockReturnValue(undefined);
    mockPreload.mockResolvedValue({} as any);
    mockPrepareTransaction.mockResolvedValue({} as any);
    mockAssignFromAccountRaw.mockReturnValue(undefined);
    mockAssignToAccountRaw.mockReturnValue(undefined);
    mockFromOperationExtraRaw.mockReturnValue({} as any);
    mockToOperationExtraRaw.mockReturnValue({} as any);
  });

  describe("createBridges", () => {
    it("should set coin config and return bridges", () => {
      const result = createBridges(mockSignerContext, mockCoinConfig);

      expect(mockSuiConfig.setCoinConfig).toHaveBeenCalledWith(mockCoinConfig);
      expect(result).toHaveProperty("currencyBridge");
      expect(result).toHaveProperty("accountBridge");
      expect(typeof result.currencyBridge).toBe("object");
      expect(typeof result.accountBridge).toBe("object");
    });

    it("should call signerGetAddress with signer context", () => {
      createBridges(mockSignerContext, mockCoinConfig);

      expect(mockSignerGetAddress).toHaveBeenCalledWith(mockSignerContext);
    });

    it("should call buildSignOperation with signer context", () => {
      createBridges(mockSignerContext, mockCoinConfig);

      expect(mockBuildSignOperation).toHaveBeenCalledWith(mockSignerContext);
    });
  });

  describe("currencyBridge", () => {
    let currencyBridge: CurrencyBridge;

    beforeEach(() => {
      const bridges = createBridges(mockSignerContext, mockCoinConfig);
      currencyBridge = bridges.currencyBridge;
    });

    it("should have all required currency bridge methods", () => {
      expect(currencyBridge).toHaveProperty("getPreloadStrategy");
      expect(currencyBridge).toHaveProperty("preload");
      expect(currencyBridge).toHaveProperty("hydrate");
      expect(currencyBridge).toHaveProperty("scanAccounts");
    });

    it("should return getPreloadStrategy from preload module", () => {
      const strategy = currencyBridge.getPreloadStrategy?.(mockCurrency);
      expect(mockGetPreloadStrategy).toHaveBeenCalled();
      expect(strategy).toEqual({});
    });

    it("should return preload from preload module", async () => {
      const result = await currencyBridge.preload(mockCurrency);
      expect(mockPreload).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it("should return hydrate from preload module", () => {
      const data = { some: "data" };
      currencyBridge.hydrate(data, mockCurrency);
      expect(mockHydrate).toHaveBeenCalledWith(data, mockCurrency);
    });

    it("should have scanAccounts function", () => {
      expect(typeof currencyBridge.scanAccounts).toBe("function");
    });
  });

  describe("accountBridge", () => {
    let accountBridge: AccountBridge<Transaction, SuiAccount, TransactionStatus>;

    beforeEach(() => {
      const bridges = createBridges(mockSignerContext, mockCoinConfig);
      accountBridge = bridges.accountBridge;
    });

    it("should have all required account bridge methods", () => {
      const expectedMethods = [
        "estimateMaxSpendable",
        "createTransaction",
        "updateTransaction",
        "getTransactionStatus",
        "prepareTransaction",
        "sync",
        "receive",
        "signOperation",
        "broadcast",
        "assignFromAccountRaw",
        "assignToAccountRaw",
        "fromOperationExtraRaw",
        "toOperationExtraRaw",
        "getSerializedAddressParameters",
      ];

      expectedMethods.forEach(method => {
        expect(accountBridge).toHaveProperty(method);
      });
    });

    it("should call estimateMaxSpendable from estimateMaxSpendable module", async () => {
      const account = {} as SuiAccount;
      const transaction = {} as Transaction;
      const result = await accountBridge.estimateMaxSpendable({ account, transaction });
      expect(mockEstimateMaxSpendable).toHaveBeenCalledWith({ account, transaction });
      expect(result).toBeInstanceOf(BigNumber);
    });

    it("should call createTransaction from createTransaction module", () => {
      const account = {} as SuiAccount;
      const result = accountBridge.createTransaction(account);
      expect(mockCreateTransaction).toHaveBeenCalledWith(account);
      expect(result).toEqual({});
    });

    it("should call getTransactionStatus from getTransactionStatus module", () => {
      const transaction = {} as Transaction;
      const result = accountBridge.getTransactionStatus({} as SuiAccount, transaction);
      expect(mockGetTransactionStatus).toHaveBeenCalledWith({} as SuiAccount, transaction);
      expect(result).toEqual({});
    });

    it("should call prepareTransaction from prepareTransaction module", async () => {
      const account = {} as SuiAccount;
      const transaction = {} as Transaction;
      const result = await accountBridge.prepareTransaction(account, transaction);
      expect(mockPrepareTransaction).toHaveBeenCalledWith(account, transaction);
      expect(result).toEqual({});
    });

    it("should call sync from synchronisation module", () => {
      const account = {} as SuiAccount;
      const result = accountBridge.sync(account, { paginationConfig: {} });
      expect(mockSync).toHaveBeenCalledWith(account, { paginationConfig: {} });
      expect(result).toEqual({});
    });

    it("should call broadcast from broadcast module", async () => {
      const account = {} as SuiAccount;
      const signedOperation = {} as any;
      const result = await accountBridge.broadcast({ account, signedOperation });
      expect(mockBroadcast).toHaveBeenCalledWith({ account, signedOperation });
      expect(result).toEqual({});
    });

    it("should call assignFromAccountRaw from serialization module", () => {
      const accountRaw = {} as any;
      const account = {} as SuiAccount;
      accountBridge.assignFromAccountRaw?.(accountRaw, account);
      expect(mockAssignFromAccountRaw).toHaveBeenCalledWith(accountRaw, account);
    });

    it("should call assignToAccountRaw from serialization module", () => {
      const account = {} as SuiAccount;
      const accountRaw = {} as any;
      accountBridge.assignToAccountRaw?.(account, accountRaw);
      expect(mockAssignToAccountRaw).toHaveBeenCalledWith(account, accountRaw);
    });

    it("should call fromOperationExtraRaw from formatters module", () => {
      const operationExtraRaw = {} as any;
      const result = accountBridge.fromOperationExtraRaw?.(operationExtraRaw);
      expect(mockFromOperationExtraRaw).toHaveBeenCalledWith(operationExtraRaw);
      expect(result).toEqual({});
    });

    it("should call toOperationExtraRaw from formatters module", () => {
      const operationExtra = {} as any;
      const result = accountBridge.toOperationExtraRaw?.(operationExtra);
      expect(mockToOperationExtraRaw).toHaveBeenCalledWith(operationExtra);
      expect(result).toEqual({});
    });

    it("should have receive function", () => {
      expect(typeof accountBridge.receive).toBe("function");
    });

    it("should have signOperation function", () => {
      expect(typeof accountBridge.signOperation).toBe("function");
    });

    it("should have updateTransaction function", () => {
      expect(typeof accountBridge.updateTransaction).toBe("function");
    });

    it("should have getSerializedAddressParameters function", () => {
      expect(typeof accountBridge.getSerializedAddressParameters).toBe("function");
    });
  });

  describe("error handling", () => {
    it("should handle errors in createBridges gracefully", () => {
      mockSuiConfig.setCoinConfig.mockImplementation(() => {
        throw new Error("Config error");
      });

      expect(() => createBridges(mockSignerContext, mockCoinConfig)).toThrow("Config error");
    });

    it("should handle errors in signerGetAddress gracefully", () => {
      // Reset the mock to clear previous error
      mockSuiConfig.setCoinConfig.mockReset();
      mockSuiConfig.setCoinConfig.mockImplementation(() => {});

      mockSignerGetAddress.mockImplementation(() => {
        throw new Error("Signer error");
      });

      expect(() => createBridges(mockSignerContext, mockCoinConfig)).toThrow("Signer error");
    });
  });
});
