import { renderHook } from "@testing-library/react";
import { useFindTokenByAddressInCurrencyQuery } from "@domain/api-currency-token";
import { useTokenByAddressInCurrency } from "./useTokenByAddressInCurrency";

jest.mock("@domain/api-currency-token", () => ({
  useFindTokenByAddressInCurrencyQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
  })),
}));

const mockQuery = useFindTokenByAddressInCurrencyQuery as unknown as jest.Mock;

describe("useTokenByAddressInCurrency", () => {
  beforeEach(() => mockQuery.mockClear());

  it("queries with contract_address and network and returns the token", () => {
    const token = { id: "hedera/hts/0.0.123456", type: "TokenCurrency" };
    mockQuery.mockReturnValue({ data: token, isLoading: false, error: null });

    const { result } = renderHook(() => useTokenByAddressInCurrency("0.0.123456", "hedera"));

    expect(mockQuery).toHaveBeenCalledWith(
      { contract_address: "0.0.123456", network: "hedera" },
      undefined,
    );
    expect(result.current.token).toBe(token);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("exposes loading state while the query is in flight", () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });

    const { result } = renderHook(() => useTokenByAddressInCurrency("0x1234", "ethereum"));

    expect(result.current.loading).toBe(true);
    expect(result.current.token).toBeUndefined();
  });

  it("forwards the skip option to the underlying query", () => {
    renderHook(() => useTokenByAddressInCurrency("0x1234", "ethereum", { skip: true }));

    expect(mockQuery).toHaveBeenCalledWith(
      { contract_address: "0x1234", network: "ethereum" },
      { skip: true },
    );
  });

  it("exposes the query error", () => {
    const err = new Error("network error");
    mockQuery.mockReturnValue({ data: undefined, isLoading: false, error: err });

    const { result } = renderHook(() => useTokenByAddressInCurrency("0x1234", "ethereum"));

    expect(result.current.error).toBe(err);
    expect(result.current.token).toBeUndefined();
  });
});
