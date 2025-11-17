import { handlers } from "./server";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { AppPlatform, AppBranch, Visibility } from "../types";

// Mock dependencies
jest.mock("@ledgerhq/wallet-api-server", () => ({
  RPCHandler: jest.fn(),
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("@ledgerhq/cryptoassets", () => ({
  getCryptoCurrencyById: jest.fn(),
}));

jest.mock("../../bridge/crypto-assets/index", () => ({
  getCryptoAssetsStore: jest.fn(),
}));

jest.mock("../converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn(),
  getWalletAPITransactionSignFlowInfos: jest.fn(),
}));

jest.mock("../../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));

// Mock types
const mockTracking = {
  signMessageRequested: jest.fn(),
  signMessageSuccess: jest.fn(),
  signMessageFail: jest.fn(),
  signMessageNoParams: jest.fn(),
  signMessageUserRefused: jest.fn(),
  signTransactionRequested: jest.fn(),
  signTransactionSuccess: jest.fn(),
  signTransactionFail: jest.fn(),
  signTransactionNoParams: jest.fn(),
  signTransactionAndBroadcastNoParams: jest.fn(),
  broadcastSuccess: jest.fn(),
  broadcastFail: jest.fn(),
  broadcastOperationDetailsClick: jest.fn(),
};

const mockManifest = {
  id: "test-manifest",
  name: "Test App",
  url: "https://test.app",
  homepageUrl: "https://test.app",
  icon: "data:image/png;base64,test",
  apiVersion: "1.0.0",
  permissions: [],
  domains: [],
  categories: [],
  platforms: ["desktop", "ios"] as AppPlatform[],
  manifestVersion: "1.0.0",
  branch: "stable" as AppBranch,
  currencies: [],
  visibility: "complete" as Visibility,
  content: {
    shortDescription: { en: "Test app" },
    description: { en: "Test app description" },
  },
};

const mockEthereumCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  symbol: "Ξ",
  family: "evm",
  blockAvgTime: 15,
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
  keywords: ["eth", "ethereum"],
  explorerViews: [],
  explorerId: "eth",
};

const mockTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/acre_btc",
  contractAddress: "0x1234567890123456789012345678901234567890",
  parentCurrency: mockEthereumCurrency,
  tokenType: "erc20",
  name: "ACRE Bitcoin",
  ticker: "acreBTC",
  units: [
    {
      name: "ACRE Bitcoin",
      code: "acreBTC",
      magnitude: 8,
    },
  ],
};

const mockAccount: Account = {
  type: "Account",
  id: "js:2:ethereum:0x1234567890123456789012345678901234567890:ethereum",
  seedIdentifier: "0x1234567890123456789012345678901234567890",
  derivationMode: "",
  index: 0,
  freshAddress: "0x1234567890123456789012345678901234567890",
  freshAddressPath: "44'/60'/0'/0/0",
  used: false,
  blockHeight: 0,
  creationDate: new Date(),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  currency: mockEthereumCurrency,
  lastSyncDate: new Date(),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  syncHash: "0x00000000",
  subAccounts: [],
  nfts: [],
};

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getParentAccount: jest.fn(),
  getMainAccount: jest.fn(),
  makeEmptyTokenAccount: jest.fn(),
  isTokenAccount: jest.fn(),
}));

describe("ACRE Server Handlers", () => {
  let mockUiHooks: any;
  let serverHandlers: any;

  const { getCryptoAssetsStore } = jest.requireMock("../../bridge/crypto-assets/index");

  beforeEach(() => {
    jest.clearAllMocks();

    getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenCurrency),
      findTokenById: jest.fn().mockResolvedValue(mockTokenCurrency),
    });
    mockUiHooks = {
      "custom.acre.messageSign": jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess("0x1234567890abcdef");
      }),
      "custom.acre.transactionSign": jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess({
          operation: { hash: "0x1234567890abcdef" },
          signature: "0xabcdef1234567890",
        });
      }),
      "custom.acre.transactionBroadcast": jest.fn(),
      "custom.acre.registerAccount": jest.fn().mockImplementation(({ onSuccess }) => {
        onSuccess();
      }),
    };

    // Mock the account functions
    const { makeEmptyTokenAccount, getMainAccount, getParentAccount } = jest.requireMock(
      "@ledgerhq/coin-framework/account/index",
    );
    makeEmptyTokenAccount.mockReturnValue({
      type: "TokenAccount",
      id: "mock-token-account-id",
      parentId: "mock-parent-id",
      token: mockTokenCurrency,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      creationDate: new Date(),
      operationsCount: 0,
      operations: [],
      pendingOperations: [],
      balanceHistoryCache: {
        HOUR: { latestDate: null, balances: [] },
        DAY: { latestDate: null, balances: [] },
        WEEK: { latestDate: null, balances: [] },
      },
      swapHistory: [],
    });
    getMainAccount.mockReturnValue(mockAccount);
    getParentAccount.mockReturnValue(undefined);

    // Mock the converter functions
    const { getAccountIdFromWalletAccountId, getWalletAPITransactionSignFlowInfos } =
      jest.requireMock("../converters");
    getAccountIdFromWalletAccountId.mockReturnValue(
      "js:2:ethereum:0x1234567890123456789012345678901234567890:ethereum",
    );
    getWalletAPITransactionSignFlowInfos.mockReturnValue({
      canEditFees: true,
      liveTx: { family: "evm" },
      hasFeesProvided: true,
    });

    // Mock the bridge
    const { getAccountBridge } = jest.requireMock("../../bridge");
    getAccountBridge.mockReturnValue({
      broadcast: jest.fn().mockResolvedValue({ hash: "0x1234567890abcdef" }),
    });

    serverHandlers = handlers({
      accounts: [mockAccount],
      tracking: mockTracking,
      manifest: mockManifest,
      uiHooks: mockUiHooks,
    });
  });

  describe("custom.acre.messageSign", () => {
    it("should handle message signing request successfully", async () => {
      const mockParams = {
        accountId: "test-account-id",
        message: { type: "SignIn", message: "test" },
        derivationPath: "0/0",
        options: { hwAppId: "test-app" },
        meta: { test: "data" },
      };

      const mockSignature = "0x1234567890abcdef";
      mockUiHooks["custom.acre.messageSign"].mockImplementation(({ onSuccess }) => {
        onSuccess(mockSignature);
      });

      const result = await serverHandlers["custom.acre.messageSign"](mockParams);

      expect(result).toEqual({
        hexSignedMessage: "1234567890abcdef",
      });
      expect(mockTracking.signMessageRequested).toHaveBeenCalledWith(mockManifest);
      expect(mockTracking.signMessageSuccess).toHaveBeenCalledWith(mockManifest);
    });

    it("should handle missing parameters", async () => {
      const result = await serverHandlers["custom.acre.messageSign"](null);

      expect(result).toEqual({
        hexSignedMessage: "",
      });
      expect(mockTracking.signMessageNoParams).toHaveBeenCalledWith(mockManifest);
    });

    it("should handle account not found", async () => {
      const mockParams = {
        accountId: "non-existent-account",
        message: { type: "SignIn", message: "test" },
        derivationPath: "0/0",
        options: {},
        meta: {},
      };

      // Mock getAccountIdFromWalletAccountId to return null for non-existent account
      const { getAccountIdFromWalletAccountId } = jest.requireMock("../converters");
      getAccountIdFromWalletAccountId.mockReturnValueOnce(null);

      await expect(serverHandlers["custom.acre.messageSign"](mockParams)).rejects.toThrow(
        "accountId non-existent-account unknown",
      );
    });
  });

  describe("custom.acre.transactionSign", () => {
    it("should handle transaction signing request successfully", async () => {
      const mockParams = {
        accountId: "test-account-id",
        rawTransaction: "0x1234567890abcdef",
        options: { hwAppId: "test-app" },
        meta: { test: "data" },
        tokenCurrency: "ethereum/erc20/test",
      };

      const mockSignedOperation = {
        operation: { hash: "0x1234567890abcdef" },
        signature: "0xabcdef1234567890",
      };

      mockUiHooks["custom.acre.transactionSign"].mockImplementation(({ onSuccess }) => {
        onSuccess(mockSignedOperation);
      });

      const result = await serverHandlers["custom.acre.transactionSign"](mockParams);

      expect(result).toEqual({
        signedTransactionHex: "307861626364656631323334353637383930",
      });
      expect(mockTracking.signTransactionRequested).toHaveBeenCalledWith(mockManifest);
      expect(mockTracking.signTransactionSuccess).toHaveBeenCalledWith(mockManifest);
    });

    it("should handle missing parameters", async () => {
      const result = await serverHandlers["custom.acre.transactionSign"](null);

      expect(result).toEqual({
        signedTransactionHex: "",
      });
      expect(mockTracking.signTransactionNoParams).toHaveBeenCalledWith(mockManifest);
    });
  });

  describe("custom.acre.transactionSignAndBroadcast", () => {
    it("should handle transaction sign and broadcast successfully", async () => {
      const mockParams = {
        accountId: "test-account-id",
        rawTransaction: "0x1234567890abcdef",
        options: { hwAppId: "test-app" },
        meta: { test: "data" },
        tokenCurrency: "ethereum/erc20/test",
      };

      const mockSignedOperation = {
        operation: { hash: "0x1234567890abcdef" },
        signature: "0xabcdef1234567890",
      };

      mockUiHooks["custom.acre.transactionSign"].mockImplementation(({ onSuccess }) => {
        onSuccess(mockSignedOperation);
      });

      const result = await serverHandlers["custom.acre.transactionSignAndBroadcast"](mockParams);

      expect(result).toEqual({
        transactionHash: "0x1234567890abcdef",
      });
    });

    it("should handle missing parameters", async () => {
      const result = await serverHandlers["custom.acre.transactionSignAndBroadcast"](null);

      expect(result).toEqual({
        transactionHash: "",
      });
      expect(mockTracking.signTransactionAndBroadcastNoParams).toHaveBeenCalledWith(mockManifest);
    });
  });

  describe("custom.acre.registerYieldBearingEthereumAddress", () => {
    const mockParams = {
      ethereumAddress: "0x9876543210987654321098765432109876543210",
      tokenContractAddress: "0x1234567890123456789012345678901234567890",
      meta: { test: "data" },
    };

    it("should register new yield-bearing Ethereum address successfully on mobile", async () => {
      const result =
        await serverHandlers["custom.acre.registerYieldBearingEthereumAddress"](mockParams);

      expect(result.success).toBe(true);
      expect(result.accountName).toBe("Yield-bearing BTC on ACRE");
      expect(result.ethereumAddress).toBe(mockParams.ethereumAddress);
      expect(result.tokenContractAddress).toBe(mockParams.tokenContractAddress);

      // Verify UI hook was called with correct parameters
      expect(mockUiHooks["custom.acre.registerAccount"]).toHaveBeenCalledWith({
        parentAccount: expect.objectContaining({
          type: "Account",
          id: expect.stringContaining("0x9876543210987654321098765432109876543210"),
        }),
        accountName: "Yield-bearing BTC on ACRE",
        existingAccounts: [mockAccount],
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it("should register new yield-bearing Ethereum address successfully on desktop", async () => {
      const desktopServerHandlers = handlers({
        accounts: [mockAccount],
        tracking: mockTracking,
        manifest: mockManifest,
        uiHooks: mockUiHooks,
      });

      const result = await (
        desktopServerHandlers["custom.acre.registerYieldBearingEthereumAddress"] as any
      )(mockParams);

      expect(result.success).toBe(true);

      expect(mockUiHooks["custom.acre.registerAccount"]).toHaveBeenCalledWith({
        parentAccount: expect.objectContaining({
          type: "Account",
          id: expect.stringContaining("0x9876543210987654321098765432109876543210"),
        }),
        accountName: "Yield-bearing BTC on ACRE",
        existingAccounts: [mockAccount],
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it("should handle existing account gracefully", async () => {
      const existingAccount = {
        ...mockAccount,
        freshAddress: mockParams.ethereumAddress,
      };

      const serverHandlersWithExisting = handlers({
        accounts: [existingAccount],
        tracking: mockTracking,
        manifest: mockManifest,
        uiHooks: mockUiHooks,
      });

      const result = await (
        serverHandlersWithExisting["custom.acre.registerYieldBearingEthereumAddress"] as any
      )(mockParams);

      expect(result.success).toBe(true);
      expect(result.parentAccountId).toBe(existingAccount.id);
      expect(result.tokenAccountId).toBe(existingAccount.id);
      expect(mockUiHooks["custom.acre.registerAccount"]).not.toHaveBeenCalled();
    });

    it("should handle missing UI hook", async () => {
      const serverHandlersWithoutHook = handlers({
        accounts: [mockAccount],
        tracking: mockTracking,
        manifest: mockManifest,
        uiHooks: {
          ...mockUiHooks,
          "custom.acre.registerAccount": undefined,
        },
      });

      await expect(
        (serverHandlersWithoutHook["custom.acre.registerYieldBearingEthereumAddress"] as any)(
          mockParams,
        ),
      ).rejects.toThrow("No account registration UI hook available");
    });

    it("should validate Ethereum address format", async () => {
      const invalidParams = {
        ...mockParams,
        ethereumAddress: "invalid-address",
      };

      await expect(
        serverHandlers["custom.acre.registerYieldBearingEthereumAddress"](invalidParams),
      ).rejects.toThrow("Invalid Ethereum address format");
    });

    it("should require either tokenContractAddress or tokenTicker", async () => {
      const invalidParams = {
        ethereumAddress: mockParams.ethereumAddress,
        meta: mockParams.meta,
      };

      await expect(
        serverHandlers["custom.acre.registerYieldBearingEthereumAddress"](invalidParams),
      ).rejects.toThrow("Either tokenContractAddress or tokenTicker must be provided");
    });
  });
});
