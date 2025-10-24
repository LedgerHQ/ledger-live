/// <reference types="jest" />
import {
  ApiResponseSchema,
  cryptoAssetsApi,
  useGetTokensDataInfiniteQuery,
  useFindTokenByIdQuery,
  useFindTokenByAddressInCurrencyQuery,
  useGetTokensSyncHashQuery,
  transformTokensResponse,
  transformApiTokenToTokenCurrency,
  validateAndTransformSingleTokenResponse,
} from "./api";
import type { ApiTokenResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";

// Mock live-env
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));

// Mock api-token-converter
jest.mock("../../api-token-converter", () => ({
  convertApiToken: jest.fn(),
  legacyIdToApiId: jest.fn((id: string) => id),
}));

import { convertApiToken } from "../../api-token-converter";

const mockGetEnv = getEnv as jest.MockedFunction<typeof getEnv>;

describe("api.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation((key: string) => {
      if (key === "CAL_SERVICE_URL") return "https://cal.api.live.ledger.com";
      if (key === "CAL_SERVICE_URL_STAGING") return "https://cal.api.staging.ledger.com";
      if (key === "LEDGER_CLIENT_VERSION") return "1.0.0";
      return "";
    });
  });

  describe("ApiResponseSchema", () => {
    const mockApiTokenResponse: ApiTokenResponse = {
      id: "ethereum/erc20/usd_coin",
      contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      standard: "erc20",
      decimals: 6,
      delisted: false,
      live_signature: "3045022100...",
    };

    it("should validate an array of tokens", () => {
      const result = ApiResponseSchema.parse([mockApiTokenResponse]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockApiTokenResponse);
    });

    it("should validate an empty array", () => {
      const result = ApiResponseSchema.parse([]);
      expect(result).toHaveLength(0);
    });

    it("should validate multiple tokens", () => {
      const result = ApiResponseSchema.parse([mockApiTokenResponse, mockApiTokenResponse]);
      expect(result).toHaveLength(2);
    });

    it("should throw on invalid data", () => {
      expect(() => ApiResponseSchema.parse("not an array")).toThrow();
    });

    it("should throw on invalid token structure", () => {
      expect(() => ApiResponseSchema.parse([{ invalid: "data" }])).toThrow();
    });

    it("should throw on missing required fields", () => {
      const invalidToken = { ...mockApiTokenResponse };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (invalidToken as any).id;
      expect(() => ApiResponseSchema.parse([invalidToken])).toThrow();
    });

    it("should validate token with optional fields", () => {
      const tokenWithOptionals = {
        ...mockApiTokenResponse,
        token_identifier: "some-identifier",
      };
      const result = ApiResponseSchema.parse([tokenWithOptionals]);
      expect(result[0].token_identifier).toBe("some-identifier");
    });

    it("should validate token without optional fields", () => {
      const tokenWithoutOptionals = { ...mockApiTokenResponse };
      delete tokenWithoutOptionals.token_identifier;
      delete tokenWithoutOptionals.live_signature;
      const result = ApiResponseSchema.parse([tokenWithoutOptionals]);
      expect(result[0]).toBeDefined();
      expect(result[0].token_identifier).toBeUndefined();
      expect(result[0].live_signature).toBeUndefined();
    });
  });

  describe("cryptoAssetsApi configuration", () => {
    it("should have the correct reducer path", () => {
      expect(cryptoAssetsApi.reducerPath).toBe("cryptoAssetsApi");
    });

    it("should have findTokenById endpoint", () => {
      expect(cryptoAssetsApi.endpoints.findTokenById).toBeDefined();
    });

    it("should have findTokenByAddressInCurrency endpoint", () => {
      expect(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency).toBeDefined();
    });

    it("should have getTokensSyncHash endpoint", () => {
      expect(cryptoAssetsApi.endpoints.getTokensSyncHash).toBeDefined();
    });

    it("should have getTokensData endpoint", () => {
      expect(cryptoAssetsApi.endpoints.getTokensData).toBeDefined();
    });
  });

  describe("hook exports", () => {
    it("should export hooks from the API", () => {
      // Imported at the top of file already validates these exist
      expect(useGetTokensDataInfiniteQuery).toBeDefined();
      expect(useFindTokenByIdQuery).toBeDefined();
      expect(useFindTokenByAddressInCurrencyQuery).toBeDefined();
      expect(useGetTokensSyncHashQuery).toBeDefined();
    });
  });

  describe("API integration tests", () => {
    it("should have correct interface types for TokenByIdParams", () => {
      const params: import("./api").TokenByIdParams = {
        id: "ethereum/erc20/usdc",
      };
      expect(params.id).toBe("ethereum/erc20/usdc");
    });

    it("should have correct interface types for TokenByAddressInCurrencyParams", () => {
      const params: import("./api").TokenByAddressInCurrencyParams = {
        contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        network: "ethereum",
      };
      expect(params.contract_address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
      expect(params.network).toBe("ethereum");
    });
  });

  describe("baseQuery configuration", () => {
    it("should be properly configured", () => {
      // The prepareHeaders function is used internally
      // We can verify it's called correctly by checking getEnv calls
      expect(cryptoAssetsApi).toBeDefined();
      expect(cryptoAssetsApi.reducerPath).toBe("cryptoAssetsApi");
    });
  });

  describe("transformTokensResponse", () => {
    const mockApiTokenResponse: ApiTokenResponse = {
      id: "ethereum/erc20/usd_coin",
      contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      standard: "erc20",
      decimals: 6,
      delisted: false,
      live_signature: "3045022100...",
    };

    const mockTokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd_coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      tokenType: "erc20",
      delisted: false,
      disableCountervalue: false,
      parentCurrency: {} as any,
    };

    beforeEach(() => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>).mockReturnValue(
        mockTokenCurrency,
      );
    });

    it("should transform an array of API tokens to TokenCurrency array", () => {
      const result = transformTokensResponse([mockApiTokenResponse]);

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]).toEqual(mockTokenCurrency);
    });

    it("should extract nextCursor from response headers", () => {
      const meta: Partial<FetchBaseQueryMeta> = {
        response: {
          headers: {
            get: jest.fn((header: string) => {
              if (header === "x-ledger-next") return "next-cursor-value";
              return null;
            }),
          } as any,
        } as any,
      };

      const result = transformTokensResponse([mockApiTokenResponse], meta as FetchBaseQueryMeta);

      expect(result.pagination.nextCursor).toBe("next-cursor-value");
    });

    it("should set nextCursor to undefined when no header is present", () => {
      const meta: Partial<FetchBaseQueryMeta> = {
        response: {
          headers: {
            get: jest.fn(() => null),
          } as any,
        } as any,
      };

      const result = transformTokensResponse([mockApiTokenResponse], meta as FetchBaseQueryMeta);

      expect(result.pagination.nextCursor).toBeUndefined();
    });

    it("should set nextCursor to undefined when meta is not provided", () => {
      const result = transformTokensResponse([mockApiTokenResponse]);

      expect(result.pagination.nextCursor).toBeUndefined();
    });

    it("should filter out tokens that fail conversion", () => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>)
        .mockReturnValueOnce(mockTokenCurrency)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(mockTokenCurrency);

      const result = transformTokensResponse([
        mockApiTokenResponse,
        mockApiTokenResponse,
        mockApiTokenResponse,
      ]);

      expect(result.tokens).toHaveLength(2);
    });

    it("should handle empty token array", () => {
      const result = transformTokensResponse([]);

      expect(result.tokens).toHaveLength(0);
      expect(result.pagination.nextCursor).toBeUndefined();
    });
  });

  describe("transformApiTokenToTokenCurrency", () => {
    const mockApiTokenResponse: ApiTokenResponse = {
      id: "ethereum/erc20/usd_coin",
      contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      standard: "erc20",
      decimals: 6,
      delisted: false,
      live_signature: "3045022100...",
    };

    const mockTokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd_coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      tokenType: "erc20",
      delisted: false,
      disableCountervalue: false,
      parentCurrency: {} as any,
    };

    beforeEach(() => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>).mockReturnValue(
        mockTokenCurrency,
      );
    });

    it("should convert ApiTokenResponse to TokenCurrency", () => {
      const result = transformApiTokenToTokenCurrency(mockApiTokenResponse);

      expect(result).toEqual(mockTokenCurrency);
    });

    it("should call convertApiToken with correct parameters", () => {
      transformApiTokenToTokenCurrency(mockApiTokenResponse);

      expect(convertApiToken).toHaveBeenCalledWith({
        id: mockApiTokenResponse.id,
        contractAddress: mockApiTokenResponse.contract_address,
        name: mockApiTokenResponse.name,
        ticker: mockApiTokenResponse.ticker,
        units: mockApiTokenResponse.units,
        standard: mockApiTokenResponse.standard,
        tokenIdentifier: mockApiTokenResponse.token_identifier,
        delisted: mockApiTokenResponse.delisted,
        ledgerSignature: mockApiTokenResponse.live_signature,
      });
    });

    it("should return undefined when convertApiToken returns undefined", () => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>).mockReturnValue(undefined);

      const result = transformApiTokenToTokenCurrency(mockApiTokenResponse);

      expect(result).toBeUndefined();
    });

    it("should handle tokens without optional fields", () => {
      const tokenWithoutOptionals: ApiTokenResponse = {
        ...mockApiTokenResponse,
        token_identifier: undefined,
        live_signature: undefined,
      };

      transformApiTokenToTokenCurrency(tokenWithoutOptionals);

      expect(convertApiToken).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenIdentifier: undefined,
          ledgerSignature: undefined,
        }),
      );
    });

    it("should handle tokens with token_identifier", () => {
      const tokenWithIdentifier: ApiTokenResponse = {
        ...mockApiTokenResponse,
        token_identifier: "some-identifier",
      };

      transformApiTokenToTokenCurrency(tokenWithIdentifier);

      expect(convertApiToken).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenIdentifier: "some-identifier",
        }),
      );
    });
  });

  describe("validateAndTransformSingleTokenResponse", () => {
    const mockApiTokenResponse: ApiTokenResponse = {
      id: "ethereum/erc20/usd_coin",
      contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      standard: "erc20",
      decimals: 6,
      delisted: false,
      live_signature: "3045022100...",
    };

    const mockTokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd_coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      units: [
        {
          code: "USDC",
          name: "USD Coin",
          magnitude: 6,
        },
      ],
      tokenType: "erc20",
      delisted: false,
      disableCountervalue: false,
      parentCurrency: {} as any,
    };

    beforeEach(() => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>).mockReturnValue(
        mockTokenCurrency,
      );
    });

    it("should validate and transform a single token response", () => {
      const result = validateAndTransformSingleTokenResponse([mockApiTokenResponse]);

      expect(result).toEqual(mockTokenCurrency);
    });

    it("should return undefined when array is empty", () => {
      const result = validateAndTransformSingleTokenResponse([]);

      expect(result).toBeUndefined();
    });

    it("should throw when response is not an array", () => {
      expect(() => validateAndTransformSingleTokenResponse("not an array")).toThrow();
    });

    it("should throw when token structure is invalid", () => {
      expect(() => validateAndTransformSingleTokenResponse([{ invalid: "data" }])).toThrow();
    });

    it("should call convertApiToken with correct parameters", () => {
      validateAndTransformSingleTokenResponse([mockApiTokenResponse]);

      expect(convertApiToken).toHaveBeenCalledWith({
        id: mockApiTokenResponse.id,
        contractAddress: mockApiTokenResponse.contract_address,
        name: mockApiTokenResponse.name,
        ticker: mockApiTokenResponse.ticker,
        units: mockApiTokenResponse.units,
        standard: mockApiTokenResponse.standard,
        tokenIdentifier: mockApiTokenResponse.token_identifier,
        delisted: mockApiTokenResponse.delisted,
        ledgerSignature: mockApiTokenResponse.live_signature,
      });
    });

    it("should return undefined when convertApiToken returns undefined", () => {
      (convertApiToken as jest.MockedFunction<typeof convertApiToken>).mockReturnValue(undefined);

      const result = validateAndTransformSingleTokenResponse([mockApiTokenResponse]);

      expect(result).toBeUndefined();
    });

    it("should handle tokens with optional fields", () => {
      const tokenWithOptionals: ApiTokenResponse = {
        ...mockApiTokenResponse,
        token_identifier: "some-identifier",
        live_signature: "signature",
      };

      validateAndTransformSingleTokenResponse([tokenWithOptionals]);

      expect(convertApiToken).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenIdentifier: "some-identifier",
          ledgerSignature: "signature",
        }),
      );
    });

    it("should validate token schema before transformation", () => {
      const invalidToken = {
        ...mockApiTokenResponse,
        units: [], // units must have at least 1 item
      };

      expect(() => validateAndTransformSingleTokenResponse([invalidToken])).toThrow();
    });
  });
});
