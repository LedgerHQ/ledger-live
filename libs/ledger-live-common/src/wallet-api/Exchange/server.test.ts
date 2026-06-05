import network from "@ledgerhq/live-network";
import { RpcRequest } from "@ledgerhq/wallet-api-core";
import {
  ExchangeCompleteParams,
  ExchangeStartParams,
  ExchangeStartSellParams,
  ExchangeStartSwapParams,
  ExchangeStartFundParams,
  ExchangeSwapParams,
} from "@ledgerhq/wallet-api-exchange-module";
import { WalletContext, WalletHandlers } from "@ledgerhq/wallet-api-server";
import BigNumber from "bignumber.js";
import { genAccount } from "../../mock/account";
import { AppBranch, AppPlatform, Visibility } from "../types";
import { handlers } from "./server";

const mockTracking = {
  startExchangeRequested: jest.fn(),
  startExchangeSuccess: jest.fn(),
  startExchangeFail: jest.fn(),
  startExchangeNoParams: jest.fn(),
  completeExchangeRequested: jest.fn(),
  completeExchangeSuccess: jest.fn(),
  completeExchangeFail: jest.fn(),
  completeExchangeNoParams: jest.fn(),
  swapPayloadRequested: jest.fn(),
  swapResponseRetrieved: jest.fn(),
};
const testAppManifest = {
  id: "12",
  name: "test",
  url: "localhost",
  homepageUrl: "localhost",
  platforms: ["desktop"] as AppPlatform[],
  apiVersion: "2",
  manifestVersion: "2",
  branch: "debug" as AppBranch,
  permissions: [],
  domains: [],
  categories: [],
  currencies: ["btc"], //"*",
  visibility: "complete" as Visibility,
  content: {
    shortDescription: {
      en: "desc",
    },
    description: {
      en: "description",
    },
  },
};

const mockUiStartExchange = jest.fn();
const mockUiCompleteExchange = jest.fn();
const mockUiSwap = jest.fn();
const mockUiError = jest.fn();
const mockIsReady = jest.fn();

const mockUiHooks = {
  "custom.exchange.start": mockUiStartExchange,
  "custom.exchange.complete": mockUiCompleteExchange,
  "custom.exchange.error": mockUiError,
  "custom.isReady": mockIsReady,
  "custom.exchange.swap": mockUiSwap,
};

// Mock converter id to send back the id received in params.
jest.mock("../converters", () => {
  return {
    getAccountIdFromWalletAccountId: (val: string) => val,
    getWalletAPITransactionSignFlowInfos: jest.fn(),
  };
});

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index"),
  getParentAccount: jest.fn((account: unknown) => account),
  getMainAccount: jest.fn((account: unknown) => account),
  makeEmptyTokenAccount: jest.fn(),
}));

jest.mock("@ledgerhq/wallet-api-core", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-core"),
  createAccountNotFound: jest.fn((id: string) => ({ message: `Account not found: ${id}` })),
  createCurrencyNotFound: jest.fn((id: string) => ({ message: `Currency not found: ${id}` })),
  createUnknownError: jest.fn((d: { message: string }) => ({ message: d.message })),
  deserializeTransaction: jest.fn(),
  ServerError: class extends Error {
    constructor(details: { message: string }) {
      super(details.message);
      this.name = "ServerError";
    }
  },
}));

jest.mock("../../bridge", () => ({
  getAccountBridge: jest.fn().mockResolvedValue({}),
}));

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => {
    if (key === "SWAP_API_BASE") return "https://swap.ledger.com/v5";
    if (key === "DISABLE_TRANSACTION_BROADCAST") return false;
    return "";
  }),
}));

jest.mock("../../exchange/swap/utils/isIntegrationTestEnv", () => ({
  isIntegrationTestEnv: () => false,
}));

jest.mock("../../exchange/swap/api/v5/actions", () => ({
  retrieveSwapPayload: jest.fn().mockResolvedValue({
    binaryPayload: "deadbeef",
    signature: "abcdef",
    payinAddress: "payinAddr",
    swapId: "swap-123",
    payinExtraId: undefined,
    extraTransactionParameters: undefined,
  }),
}));

jest.mock("../../exchange/swap/transactionStrategies", () => ({
  transactionStrategy: {
    bitcoin: jest.fn().mockResolvedValue({
      family: "bitcoin",
      recipient: "payinAddr",
      amount: new (jest.requireActual("bignumber.js").default)("1000000"),
    }),
    evm: jest.fn().mockResolvedValue({
      family: "evm",
      recipient: "payinAddr",
      amount: new (jest.requireActual("bignumber.js").default)("1000000"),
    }),
  },
}));

jest.mock("@ledgerhq/hw-app-exchange", () => ({
  decodeSwapPayload: jest.fn().mockResolvedValue({
    amountToWallet: "500000",
    refundAddress: "refundAddr",
    payoutAddress: "payoutAddr",
    currencyTo: "ETH",
  }),
}));

jest.mock("../../crypto", () => ({
  sha256: jest.fn().mockReturnValue(Buffer.from("fakehash")),
}));

const mockedNetwork = jest.mocked(network);

describe("handlers", () => {
  describe("custom.exchange.start", () => {
    beforeEach(() => {
      mockUiStartExchange.mockClear();
    });

    it("calls SWAP with correct infos", async () => {
      // Given
      const accounts = [genAccount("accountId1"), genAccount("accountId2")];
      const handler = handlers({
        accounts,
        tracking: mockTracking,
        manifest: testAppManifest,
        locale: "en-US",
        counterValueCurrency: "USD",
        uiHooks: mockUiHooks,
      });

      const params: ExchangeStartSwapParams = {
        exchangeType: "SWAP",
        provider: "TestProvider",
        fromAccountId: accounts[0].id,
        toAccountId: accounts[1].id,
        tokenCurrency: undefined,
      };
      const { request, context, walletHandlers } = prepareSwapRequest(params);

      mockUiStartExchange.mockImplementation(params => {
        params.onSuccess("NONCE");
      });

      // When
      const result = await handler["custom.exchange.start"](request, context, walletHandlers);

      // Then
      expect(result).toEqual({ transactionId: "NONCE" });
      expect(mockUiStartExchange).toHaveBeenCalledTimes(1);
      const receivedParams = mockUiStartExchange.mock.calls[0][0].exchangeParams;
      expect(receivedParams.exchangeType).toBe("SWAP");
      expect(receivedParams.provider).toBe("TestProvider");
      expect(receivedParams.exchange.fromAccount).toBe(accounts[0]);
      expect(receivedParams.exchange.fromParentAccount).toBe(accounts[0]);
      expect(receivedParams.exchange.toAccount).toBe(accounts[1]);
      expect(receivedParams.exchange.toParentAccount).toBe(accounts[1]);
      expect(mockUiCompleteExchange).not.toHaveBeenCalled();
    });

    it("calls SELL with correct infos", async () => {
      // Given
      const accounts = [genAccount("accountId1"), genAccount("accountId2")];
      const handler = handlers({
        accounts,
        tracking: mockTracking,
        manifest: testAppManifest,
        locale: "en-US",
        counterValueCurrency: "USD",
        uiHooks: mockUiHooks,
      });

      const params: ExchangeStartSellParams = {
        exchangeType: "SELL",
        provider: "TestSellProvider",
        fromAccountId: accounts[0].id,
      };
      const { request, context, walletHandlers } = prepareSellRequest(params);

      mockUiStartExchange.mockImplementation(params => {
        params.onSuccess("NONCE");
      });

      // When
      const result = await handler["custom.exchange.start"](request, context, walletHandlers);

      // Then
      expect(result).toEqual({ transactionId: "NONCE" });
      expect(mockUiStartExchange).toHaveBeenCalledTimes(1);
      const receivedParams = mockUiStartExchange.mock.calls[0][0].exchangeParams;
      expect(receivedParams.exchangeType).toBe("SELL");
      expect(receivedParams.provider).toBe("TestSellProvider");
      expect(mockUiCompleteExchange).not.toHaveBeenCalled();
    });

    it("calls FUND with correct infos", async () => {
      // Given
      const accounts = [genAccount("accountId1"), genAccount("accountId2")];
      const handler = handlers({
        accounts,
        tracking: mockTracking,
        manifest: testAppManifest,
        locale: "en-US",
        counterValueCurrency: "USD",
        uiHooks: mockUiHooks,
      });

      const params: ExchangeStartFundParams = {
        exchangeType: "FUND",
        provider: "TestFundProvider",
        fromAccountId: accounts[0].id,
      };
      const { request, context, walletHandlers } = prepareSellRequest(params);

      mockUiStartExchange.mockImplementation(params => {
        params.onSuccess("NONCE");
      });

      // When
      const result = await handler["custom.exchange.start"](request, context, walletHandlers);

      // Then
      expect(result).toEqual({ transactionId: "NONCE" });
      expect(mockUiStartExchange).toHaveBeenCalledTimes(1);
      const receivedParams = mockUiStartExchange.mock.calls[0][0].exchangeParams;
      expect(receivedParams.exchangeType).toBe("FUND");
      expect(receivedParams.provider).toBe("TestFundProvider");
      expect(mockUiCompleteExchange).not.toHaveBeenCalled();
    });
  });

  describe("custom.exchange.swap", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("calls /swap/accepted on successful swap", async () => {
      const accounts = [genAccount("accountId1"), genAccount("accountId2")];
      const fromAccount = accounts[0];
      const toAccount = accounts[1];

      const { getMainAccount } = jest.requireMock(
        "@ledgerhq/ledger-wallet-framework/account/index",
      );
      getMainAccount.mockReturnValue(fromAccount);

      const { getAccountBridge } = jest.requireMock("../../bridge");
      getAccountBridge.mockResolvedValue({
        createTransaction: jest.fn().mockReturnValue({ family: "bitcoin", recipient: "" }),
        updateTransaction: jest.fn().mockImplementation((tx: object, upd: object) => ({
          ...tx,
          ...upd,
          amount: new BigNumber("1000000"),
        })),
      });

      mockUiStartExchange.mockImplementation(({ onSuccess }) => {
        onSuccess("NONCE", { modelId: "nanoX", deviceId: "device-1" });
      });

      mockUiSwap.mockImplementation(({ onSuccess }) => {
        onSuccess({ operationHash: "0xhash", swapId: "swap-123" });
      });

      const handler = handlers({
        accounts,
        locale: "en",
        counterValueCurrency: "USD",
        tracking: mockTracking,
        manifest: testAppManifest,
        uiHooks: mockUiHooks,
      });

      const params: ExchangeSwapParams = {
        exchangeType: "SWAP",
        provider: "TestProvider",
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        tokenCurrency: undefined,
        fromAmount: "1000000",
        fromAmountAtomic: new BigNumber("1000000"),
        feeStrategy: "medium",
      };

      const request = {
        jsonrpc: "2.0",
        method: "custom.exchange.swap",
        params,
        id: "test",
      } as unknown as RpcRequest<string, ExchangeSwapParams>;
      const context = {
        config: { userId: "u", tracking: false, wallet: { name: "w", version: "2" }, appId: "a" },
      };

      const result = await handler["custom.exchange.swap"](request, context, {});

      expect(result).toEqual({ operationHash: "0xhash", swapId: "swap-123" });

      const networkCall = mockedNetwork.mock.calls.find(([req]) =>
        (req as { url?: string }).url?.includes("/swap/accepted"),
      );
      expect(networkCall).toBeDefined();
      expect((networkCall![0] as { url: string }).url).toContain("/swap/accepted");
    });
  });

  describe("custom.exchange.complete", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns empty hash when no params", async () => {
      const accounts = [genAccount("accountId1")];
      const handler = handlers({
        accounts,
        tracking: mockTracking,
        manifest: testAppManifest,
        locale: "en-US",
        counterValueCurrency: "USD",
        uiHooks: mockUiHooks,
      });

      const request = {
        jsonrpc: "2.0",
        method: "custom.exchange.complete",
        params: null,
        id: "test",
      } as unknown as RpcRequest<string, ExchangeCompleteParams>;
      const context = {
        config: { userId: "u", tracking: false, wallet: { name: "w", version: "2" }, appId: "a" },
      };

      const result = await handler["custom.exchange.complete"](request, context, {});
      expect(result).toEqual({ transactionHash: "" });
      expect(mockTracking.completeExchangeNoParams).toHaveBeenCalledWith(testAppManifest);
    });

    it("calls getWalletAPITransactionSignFlowInfos on SELL exchange", async () => {
      const accounts = [genAccount("accountId1")];
      const account = accounts[0];

      const { getMainAccount } = jest.requireMock(
        "@ledgerhq/ledger-wallet-framework/account/index",
      );
      getMainAccount.mockReturnValue({
        ...account,
        currency: { ...account.currency, family: "bitcoin" },
      });

      const { deserializeTransaction } = jest.requireMock("@ledgerhq/wallet-api-core");
      deserializeTransaction.mockReturnValue({ family: "bitcoin", recipient: "bc1test" });

      const { getWalletAPITransactionSignFlowInfos } = jest.requireMock("../converters");
      getWalletAPITransactionSignFlowInfos.mockResolvedValue({
        canEditFees: true,
        hasFeesProvided: false,
        liveTx: { family: "bitcoin", recipient: "bc1test" },
      });

      const { getAccountBridge } = jest.requireMock("../../bridge");
      getAccountBridge.mockResolvedValue({
        createTransaction: jest.fn().mockReturnValue({ family: "bitcoin", recipient: "" }),
        updateTransaction: jest
          .fn()
          .mockImplementation((tx: object, upd: object) => ({ ...tx, ...upd })),
      });

      mockUiCompleteExchange.mockImplementation(
        ({ onSuccess }: { onSuccess: (hash: string) => void }) => {
          onSuccess("0xhash123");
        },
      );

      const handler = handlers({
        accounts,
        tracking: mockTracking,
        manifest: testAppManifest,
        locale: "en-US",
        counterValueCurrency: "USD",
        uiHooks: mockUiHooks,
      });

      const params = {
        provider: "TestProvider",
        exchangeType: "SELL",
        fromAccountId: account.id,
        rawTransaction: { family: "bitcoin" } as never,
        hexBinaryPayload: "deadbeef",
        hexSignature: "abcdef",
        feeStrategy: "medium",
      } as ExchangeCompleteParams;
      const request = {
        jsonrpc: "2.0",
        method: "custom.exchange.complete",
        params,
        id: "test",
      } as RpcRequest<string, ExchangeCompleteParams>;
      const context = {
        config: { userId: "u", tracking: false, wallet: { name: "w", version: "2" }, appId: "a" },
      };

      const result = await handler["custom.exchange.complete"](request, context, {});
      expect(result).toEqual({ transactionHash: "0xhash123" });
      expect(getWalletAPITransactionSignFlowInfos).toHaveBeenCalledWith({
        walletApiTransaction: { family: "bitcoin", recipient: "bc1test" },
        account,
      });
      expect(mockTracking.completeExchangeSuccess).toHaveBeenCalled();
    });
  });
});

type PreparedRequest = {
  request: RpcRequest<string, ExchangeStartParams | ExchangeStartSwapParams>;
  context: WalletContext;
  walletHandlers: Partial<WalletHandlers>;
};
function prepareSwapRequest(params: ExchangeStartSwapParams): PreparedRequest {
  const request: RpcRequest<string, ExchangeStartSwapParams> = {
    jsonrpc: "2.0",
    method: "custom.exchange.start",
    params: params,
    id: "jsonRpcRequestId",
  };

  const context = {
    config: {
      userId: "userId",
      tracking: false,
      wallet: {
        name: "wallet name",
        version: "2",
      },
      appId: "appId",
    },
  };

  return {
    request,
    context,
    walletHandlers: {},
  };
}

function prepareSellRequest(params: ExchangeStartParams): PreparedRequest {
  const request: RpcRequest<string, ExchangeStartParams> = {
    jsonrpc: "2.0",
    method: "custom.exchange.start",
    params: params,
    id: "jsonRpcRequestId",
  };

  const context = {
    config: {
      userId: "userId",
      tracking: false,
      wallet: {
        name: "wallet name",
        version: "2",
      },
      appId: "appId",
    },
  };

  return {
    request,
    context,
    walletHandlers: {},
  };
}
