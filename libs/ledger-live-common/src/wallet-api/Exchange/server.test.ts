import { handlers } from "./server";
import { AppBranch, AppPlatform, Visibility } from "../types";
import { of } from "rxjs";
import {
  ExchangeStartParams,
  ExchangeStartSellParams,
  ExchangeStartSwapParams,
} from "@ledgerhq/wallet-api-exchange-module";
import { RpcRequest } from "@ledgerhq/wallet-api-core";
import { genAccount } from "../../mock/account";
import { WalletContext, WalletHandlers } from "@ledgerhq/wallet-api-server";

const mockTracking = {
  startExchangeRequested: jest.fn(),
  startExchangeSuccess: jest.fn(),
  startExchangeFail: jest.fn(),
  startExchangeNoParams: jest.fn(),
  completeExchangeRequested: jest.fn(),
  completeExchangeSuccess: jest.fn(),
  completeExchangeFail: jest.fn(),
  completeExchangeNoParams: jest.fn(),
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

const mockUiHooks = {
  "custom.exchange.start": mockUiStartExchange,
  "custom.exchange.complete": mockUiCompleteExchange,
};

// Mock converter id to send back the id received in params.
jest.mock("../converters", () => {
  return {
    getAccountIdFromWalletAccountId: (val: string) => val,
  };
});

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
        uiHooks: mockUiHooks,
      });

      const params: ExchangeStartSellParams = {
        exchangeType: "SELL",
        provider: "TestSellProvider",
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
        uiHooks: mockUiHooks,
      });

      const params: ExchangeStartParams = {
        exchangeType: "FUND",
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
      expect(mockUiCompleteExchange).not.toHaveBeenCalled();
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
    currencies$: of([]),
    accounts$: of([]),
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
    currencies$: of([]),
    accounts$: of([]),
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
