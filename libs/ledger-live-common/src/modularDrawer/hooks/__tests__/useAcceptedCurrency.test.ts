/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useAcceptedCurrency } from "../useAcceptedCurrency";
import { CryptoCurrency, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrency } from "@domain/entity-currency-token";
import { useCurrenciesUnderFeatureFlag } from "../useCurrenciesUnderFeatureFlag";
import { isCurrencySupported } from "../../../coin-modules/registry";
import { ModularDrawerLocation } from "../../enums";

// Mock dependencies
jest.mock("../useCurrenciesUnderFeatureFlag");
jest.mock("../../../coin-modules/registry", () => ({
  ...jest.requireActual("../../../coin-modules/registry"),
  isCurrencySupported: jest.fn(),
}));

const mockUseCurrenciesUnderFeatureFlag = useCurrenciesUnderFeatureFlag as jest.MockedFunction<
  typeof useCurrenciesUnderFeatureFlag
>;
const mockIsCurrencySupported = isCurrencySupported as jest.MockedFunction<
  typeof isCurrencySupported
>;

describe("useAcceptedCurrency", () => {
  const mockCryptoCurrency: CryptoCurrency = {
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    type: "CryptoCurrency",
  } as CryptoCurrency;

  const mockDeactivatedCurrency: CryptoCurrency = {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    type: "CryptoCurrency",
  } as CryptoCurrency;

  const mockTokenCurrency: TokenCurrency = {
    id: "usdc",
    name: "USD Coin",
    ticker: "USDC",
    type: "TokenCurrency",
    parentCurrencyId: "bitcoin",
  } as TokenCurrency;

  const mockTokenWithDeactivatedParent: TokenCurrency = {
    id: "weth",
    name: "Wrapped Ethereum",
    ticker: "WETH",
    type: "TokenCurrency",
    parentCurrencyId: "ethereum",
  } as TokenCurrency;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for a supported and non-deactivated currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set<string>(),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockCryptoCurrency);

    expect(isAccepted).toBe(true);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(mockCryptoCurrency);
  });

  it("should return false for a deactivated currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set(["ethereum"]),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockDeactivatedCurrency);

    expect(isAccepted).toBe(false);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(mockDeactivatedCurrency);
  });

  it("should return false for an unsupported currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set<string>(),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(false);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockCryptoCurrency);

    expect(isAccepted).toBe(false);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(mockCryptoCurrency);
  });

  it("should return true for a token with an accepted parent currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set<string>(),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockTokenCurrency);

    expect(isAccepted).toBe(true);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(getCryptoCurrencyById("bitcoin"));
  });

  it("should return false for a token with a deactivated parent currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set(["ethereum"]),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockTokenWithDeactivatedParent);

    expect(isAccepted).toBe(false);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(getCryptoCurrencyById("ethereum"));
  });

  it("should return false for a token with an unsupported parent currency", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set<string>(),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(false);

    const { result } = renderHook(() => useAcceptedCurrency());
    const isAccepted = result.current(mockTokenCurrency);

    expect(isAccepted).toBe(false);
    expect(mockIsCurrencySupported).toHaveBeenCalledWith(getCryptoCurrencyById("bitcoin"));
  });

  it("should update when deactivatedCurrencyIds changes", () => {
    const { result, rerender } = renderHook(() => useAcceptedCurrency());

    // First render - currency is accepted
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set<string>(),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);
    rerender();
    expect(result.current(mockCryptoCurrency)).toBe(true);

    // Second render - currency is deactivated
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set(["bitcoin"]),
      featureFlaggedCurrencies: {},
    } as any);
    rerender();
    expect(result.current(mockCryptoCurrency)).toBe(false);
  });

  describe("transfer flows", () => {
    const hypercore = {
      ...mockCryptoCurrency,
      id: "hypercore",
      family: "hypercore",
    } as CryptoCurrency;
    const hypercoreToken = {
      ...mockTokenCurrency,
      parentCurrencyId: "hypercore",
    } as TokenCurrency;

    beforeEach(() => {
      mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
        deactivatedCurrencyIds: new Set<string>(),
        featureFlaggedCurrencies: {},
      } as any);
      mockIsCurrencySupported.mockReturnValue(true);
    });

    it("should reject a family that cannot send, in the send flow (hypercore)", () => {
      const { result } = renderHook(() => useAcceptedCurrency({ flow: "send" }));

      expect(result.current(hypercore)).toBe(false);
    });

    it("should reject a token whose parent family cannot send", () => {
      const { result } = renderHook(() => useAcceptedCurrency({ flow: "send" }));

      expect(result.current(hypercoreToken)).toBe(false);
    });

    it("should reject a family that cannot receive, in the receive flow", () => {
      const { result } = renderHook(() =>
        useAcceptedCurrency({ flow: ModularDrawerLocation.RECEIVE_FLOW }),
      );

      expect(result.current(hypercore)).toBe(false);
    });

    it("should accept that same family outside of a transfer flow", () => {
      const { result } = renderHook(() =>
        useAcceptedCurrency({ flow: ModularDrawerLocation.ADD_ACCOUNT }),
      );

      expect(result.current(hypercore)).toBe(true);
    });
  });

  it("should handle multiple currencies in deactivated set", () => {
    mockUseCurrenciesUnderFeatureFlag.mockReturnValue({
      deactivatedCurrencyIds: new Set(["ethereum", "cardano", "polkadot"]),
      featureFlaggedCurrencies: {},
    } as any);
    mockIsCurrencySupported.mockReturnValue(true);

    const { result } = renderHook(() => useAcceptedCurrency());

    // Bitcoin should be accepted (not in deactivated set)
    expect(result.current(mockCryptoCurrency)).toBe(true);

    // Ethereum should be rejected (in deactivated set)
    expect(result.current(mockDeactivatedCurrency)).toBe(false);
  });
});
