import { renderHook } from "@testing-library/react";
import { useFindTokenByIdQuery } from "@domain/api-currency-token";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { useCurrencyById } from "./useCurrencyById";

jest.mock("@domain/api-currency-token", () => ({
  useFindTokenByIdQuery: jest.fn(() => ({ data: undefined, isLoading: false, error: null })),
}));

const mockQuery = useFindTokenByIdQuery as unknown as jest.Mock;

describe("useCurrencyById", () => {
  beforeEach(() => mockQuery.mockClear());

  describe("when id matches a crypto currency", () => {
    it("returns the registry entry without querying the token API", () => {
      const { result } = renderHook(() => useCurrencyById("bitcoin"));
      expect(result.current.currency).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith({ id: "bitcoin" }, { skip: true });
    });
  });

  describe("when id does not match a crypto currency", () => {
    it("queries the token API and forwards the result", () => {
      const token = { id: "ethereum/erc20/usdc", type: "TokenCurrency" };
      mockQuery.mockReturnValue({ data: token, isLoading: false, error: null });
      const { result } = renderHook(() => useCurrencyById("ethereum/erc20/usdc"));
      expect(mockQuery).toHaveBeenCalledWith({ id: "ethereum/erc20/usdc" }, { skip: false });
      expect(result.current.currency).toBe(token);
      expect(result.current.loading).toBe(false);
    });

    it("exposes loading state while the token query is in flight", () => {
      mockQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
      const { result } = renderHook(() => useCurrencyById("ethereum/erc20/usdc"));
      expect(result.current.loading).toBe(true);
      expect(result.current.currency).toBeUndefined();
    });

    it("exposes the query error", () => {
      const err = new Error("fetch failed");
      mockQuery.mockReturnValue({ data: undefined, isLoading: false, error: err });
      const { result } = renderHook(() => useCurrencyById("unknown/token"));
      expect(result.current.error).toBe(err);
    });
  });

  describe("when id is empty", () => {
    it("skips the token query and returns undefined currency", () => {
      const { result } = renderHook(() => useCurrencyById(""));
      expect(mockQuery).toHaveBeenCalledWith({ id: "" }, { skip: true });
      expect(result.current.currency).toBeUndefined();
      expect(result.current.loading).toBe(false);
    });
  });
});
