import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";

jest.mock("../converter", () => ({
  convertApiToken: jest.fn(),
}));

import { convertApiToken } from "../converter";
import {
  transformTokensResponse,
  transformApiTokenToTokenCurrency,
  validateAndTransformSingleTokenResponse,
} from "./utils";
import { mockApiTokenResponse, mockTokenCurrency } from "../fixtures";

const mockConvert = convertApiToken as jest.MockedFunction<typeof convertApiToken>;

beforeEach(() => {
  jest.clearAllMocks();
  mockConvert.mockReturnValue(mockTokenCurrency);
});

describe("transformTokensResponse", () => {
  it("should transform an array of API tokens to a TokenCurrency array", () => {
    const result = transformTokensResponse([mockApiTokenResponse]);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]).toEqual(mockTokenCurrency);
  });

  it("should extract nextCursor from response headers", () => {
    const meta = {
      response: {
        headers: {
          get: (h: string) => (h === "x-ledger-next" ? "next-cursor" : null),
        },
      },
    } as unknown as FetchBaseQueryMeta;
    const result = transformTokensResponse([mockApiTokenResponse], meta);
    expect(result.pagination.nextCursor).toBe("next-cursor");
  });

  it("should set nextCursor undefined when no meta is provided", () => {
    expect(transformTokensResponse([mockApiTokenResponse]).pagination.nextCursor).toBeUndefined();
  });

  it("should filter out tokens that fail conversion", () => {
    mockConvert
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

  it("should handle an empty token array", () => {
    const result = transformTokensResponse([]);
    expect(result.tokens).toHaveLength(0);
    expect(result.pagination.nextCursor).toBeUndefined();
  });
});

describe("transformApiTokenToTokenCurrency", () => {
  it("should call convertApiToken with mapped parameters", () => {
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
    mockConvert.mockReturnValue(undefined);
    expect(transformApiTokenToTokenCurrency(mockApiTokenResponse)).toBeUndefined();
  });
});

describe("validateAndTransformSingleTokenResponse", () => {
  it("should validate and transform a single token response", () => {
    expect(validateAndTransformSingleTokenResponse([mockApiTokenResponse])).toEqual(
      mockTokenCurrency,
    );
  });

  it("should return undefined when the array is empty", () => {
    expect(validateAndTransformSingleTokenResponse([])).toBeUndefined();
  });

  it("should throw when the response is not an array", () => {
    expect(() => validateAndTransformSingleTokenResponse("not an array")).toThrow();
  });

  it("should throw when the token structure is invalid", () => {
    expect(() => validateAndTransformSingleTokenResponse([{ invalid: "data" }])).toThrow();
  });
});
