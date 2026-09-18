import { renderHook } from "@tests/test-renderer";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { State } from "~/reducers/types";

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

jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useCurrenciesByIds: jest.fn(),
}));

jest.mock("~/actions/general", () => {
  const actual = jest.requireActual<typeof import("~/actions/general")>("~/actions/general");

  return { ...actual, addExtraSessionTrackingPairs: jest.fn(actual.addExtraSessionTrackingPairs) };
});

jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  useIsCardSignedIn: jest.fn(),
}));

import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { addExtraSessionTrackingPairs, useExtraSessionTrackingPair } from "~/actions/general";
import { usePayCardAssets } from "../usePayCardAssets";

function withRates(state: State): State {
  return {
    ...state,
    countervalues: {
      ...state.countervalues,
      countervalues: {
        ...state.countervalues.countervalues,
        state: importCountervalues(
          {
            status: {},
            [pairId({ from: usdc, to: USD })]: { latest: 1 },
            [pairId({ from: BITCOIN, to: USD })]: { latest: 100_000 },
          },
          state.countervalues.userSettings,
        ),
      },
    },
  };
}

function renderAssets() {
  return renderHook(
    () => ({ assets: usePayCardAssets(), tracked: useExtraSessionTrackingPair() }),
    { overrideInitialState: withRates },
  );
}

describe("usePayCardAssets", () => {
  beforeEach(() => {
    jest.mocked(useIsCardSignedIn).mockReturnValue(true);
    jest.mocked(useCurrenciesByIds).mockClear();
    jest.mocked(addExtraSessionTrackingPairs).mockClear();
    jest.mocked(useCurrenciesByIds).mockReturnValue(
      new Map<string, CryptoOrTokenCurrency>([
        [usdc.id, usdc],
        [BITCOIN.id, BITCOIN],
      ]),
    );
  });

  it("prices a wallet in the counter value's smallest unit", () => {
    const { result } = renderAssets();

    // 12.5 USDC at 1:1 is 1250 cents, which is what `formatCurrencyUnit` takes.
    expect(result.current.assets.priceWallet(usdc, "12.5")).toBe(1250);
    expect(result.current.assets.priceWallet(BITCOIN, "1")).toBe(10_000_000);
  });

  it("leaves a balance nobody can read unpriced, rather than calling it zero", () => {
    const { result } = renderAssets();

    for (const balance of ["", "not a number", "Infinity"]) {
      expect(result.current.assets.priceWallet(usdc, balance)).toBeNull();
    }
  });

  it("reads a comma as the decimal separator, as the parser does", () => {
    const { result } = renderAssets();

    expect(result.current.assets.priceWallet(usdc, "12,5")).toBe(1250);
  });

  it("reports no price when the rates have none for the currency", () => {
    const { result } = renderAssets();
    const litecoin = getCryptoCurrencyById("litecoin");

    expect(result.current.assets.priceWallet(litecoin, "1")).toBeNull();
  });

  it("registers every card currency against the counter value, so their rates are polled", () => {
    renderAssets();

    // Asserted on what the hook hands the store, not on the store itself: the tracking subject is
    // module state that outlives a test, so reading it would make this depend on what ran first.
    const registered = jest.mocked(addExtraSessionTrackingPairs).mock.calls[0]?.[0] ?? [];

    expect(registered.map(pairId)).toEqual([
      pairId({ from: usdc, to: USD }),
      pairId({ from: BITCOIN, to: USD }),
    ]);
  });

  it("registers a currency once, though a refetched token comes back as a new object", () => {
    const { result, rerender } = renderAssets();
    const before = result.current.tracked.length;

    // The store outlives the screen, so a duplicate would be polled for the rest of the session,
    // and a refetched token is a new object the store must still recognise.
    jest
      .mocked(useCurrenciesByIds)
      .mockReturnValue(new Map<string, CryptoOrTokenCurrency>([[usdc.id, { ...usdc }]]));
    rerender(undefined);

    expect(result.current.tracked).toHaveLength(before);
  });

  it("hands the whole catalog over in one call, so the store publishes once", () => {
    renderAssets();

    // A call per currency would notify every subscriber that many times on mount.
    expect(addExtraSessionTrackingPairs).toHaveBeenCalledTimes(1);
    expect(jest.mocked(addExtraSessionTrackingPairs).mock.calls[0]?.[0]).toHaveLength(2);
  });

  it("formats a counter value in the user's currency", () => {
    const { result } = renderAssets();

    // 1250 is the smallest unit, so USD reads 12.50 — the number is not a major-unit amount.
    expect(result.current.assets.formatCountervalue(1250)).toContain("12.50");
  });

  it("looks the card currencies up once someone is signed in", () => {
    renderAssets();

    expect(useCurrenciesByIds).toHaveBeenCalledWith(BAANX_LEDGER_CURRENCY_IDS);
  });

  it("looks nothing up while nobody is signed in, so a Pay tab visitor is charged no lookups", () => {
    jest.mocked(useIsCardSignedIn).mockReturnValue(false);

    renderAssets();

    expect(useCurrenciesByIds).toHaveBeenCalledWith([]);
  });
});
