import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { selectExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";

const USD = getFiatCurrencyByTicker("USD");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const usdc = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});

const calculateCountervalue = jest.fn();

jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useCurrenciesByIds: jest.fn(),
}));

jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  useIsCardSignedIn: jest.fn(),
}));

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useCalculateCountervalueCallback: () => calculateCountervalue,
}));

import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { usePayCardAssets } from "../usePayCardAssets";

describe("usePayCardAssets", () => {
  beforeEach(() => {
    calculateCountervalue.mockReset();
    jest.mocked(useIsCardSignedIn).mockReturnValue(true);
    jest.mocked(useCurrenciesByIds).mockClear();
    jest.mocked(useCurrenciesByIds).mockReturnValue(
      new Map<string, CryptoOrTokenCurrency>([
        [usdc.id, usdc],
        [BITCOIN.id, BITCOIN],
      ]),
    );
  });

  it("prices a balance in the currency's smallest unit, and answers in the counter value's", () => {
    calculateCountervalue.mockReturnValue(new BigNumber(1250));
    const { result } = renderHook(() => usePayCardAssets());

    // 12.5 USDC is 12_500_000 at magnitude 6, and 1250 is 12.50 at the USD magnitude of 2.
    expect(result.current.priceWallet(usdc, "12.5")).toBe(1250);
    expect(calculateCountervalue).toHaveBeenCalledWith(usdc, new BigNumber(12_500_000));
  });

  it("reads a comma as the decimal separator, as the parser does", () => {
    calculateCountervalue.mockReturnValue(new BigNumber(1250));
    const { result } = renderHook(() => usePayCardAssets());

    expect(result.current.priceWallet(usdc, "12,5")).toBe(1250);
    expect(calculateCountervalue).toHaveBeenCalledWith(usdc, new BigNumber(12_500_000));
  });

  it("leaves a balance nobody can read unpriced, rather than calling it zero", () => {
    const { result } = renderHook(() => usePayCardAssets());

    for (const balance of ["", "not a number", "Infinity"]) {
      expect(result.current.priceWallet(usdc, balance)).toBeNull();
    }
    expect(calculateCountervalue).not.toHaveBeenCalled();
  });

  it("reports no price when the rates have none for the currency", () => {
    calculateCountervalue.mockReturnValue(undefined);
    const { result } = renderHook(() => usePayCardAssets());

    expect(result.current.priceWallet(BITCOIN, "1")).toBeNull();
  });

  it("registers every card currency against the counter value, so their rates are polled", () => {
    const { store } = renderHook(() => usePayCardAssets());
    const tracked = selectExtraTrackingPairs(store.getState()).map(pairId);

    expect(tracked).toEqual([pairId({ from: usdc, to: USD }), pairId({ from: BITCOIN, to: USD })]);
  });

  it("formats a counter value in the user's currency", () => {
    const { result } = renderHook(() => usePayCardAssets());

    // 1250 is the smallest unit, so USD reads 12.50 — the number is not a major-unit amount.
    expect(result.current.formatCountervalue(1250)).toContain("12.50");
  });

  it("looks the card currencies up once someone is signed in", () => {
    renderHook(() => usePayCardAssets());

    expect(useCurrenciesByIds).toHaveBeenCalledWith(BAANX_LEDGER_CURRENCY_IDS);
  });

  it("looks nothing up while nobody is signed in, so a visitor is charged no lookups", () => {
    jest.mocked(useIsCardSignedIn).mockReturnValue(false);

    renderHook(() => usePayCardAssets());

    expect(useCurrenciesByIds).toHaveBeenCalledWith([]);
  });
});
