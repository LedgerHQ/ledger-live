import { renderHook } from "@tests/test-renderer";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { BAANX_ASSET_LEDGER_IDS } from "@domain/entity-card-asset-mapping";
import type { State } from "~/reducers/types";

jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useTokenById: jest.fn(),
}));

import { useTokenById } from "@features/platform-currencies";
import { useExtraSessionTrackingPair } from "~/actions/general";
import { usePayCardWalletCounterValue } from "../usePayCardWalletCounterValue";

const USD = getFiatCurrencyByTicker("USD");
const BITCOIN = getCryptoCurrencyById("bitcoin");
const ETHEREUM = getCryptoCurrencyById("ethereum");

const USDC_ID = "ethereum/erc20/usd__coin";
const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

function erc20(id: string, ticker: string, name: string) {
  return TokenCurrencySchema.parse({
    type: "TokenCurrency",
    id,
    parentCurrencyId: ETHEREUM.id,
    contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
    tokenType: "erc20",
    name,
    ticker,
    units: [{ name, code: ticker, magnitude: 6 }],
  });
}

const USDC = erc20(USDC_ID, "USDC", "USD Coin");
const USDT = erc20(USDT_ID, "USDT", "Tether USD");

const CARD_CURRENCY_IDS = [
  ...new Set(Object.values(BAANX_ASSET_LEDGER_IDS).filter((id): id is string => id !== undefined)),
];

const CARD_TOKEN_IDS = CARD_CURRENCY_IDS.filter(id => findCryptoCurrencyById(id) === undefined);

/** Seeds the rates, so the resolver prices through the real countervalue state. */
function withRates(rates: Record<string, number>) {
  return (state: State): State => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      countervalues: {
        ...state.countervalues.countervalues,
        state: importCountervalues(
          {
            status: {},
            ...Object.fromEntries(
              Object.entries(rates).map(([path, latest]) => [path, { latest }]),
            ),
          },
          state.countervalues.userSettings,
        ),
      },
    },
  });
}

const USDC_AT_ONE = { [pairId({ from: USDC, to: USD })]: 1 };
const BITCOIN_AT_100K = { [pairId({ from: BITCOIN, to: USD })]: 100_000 };

function renderResolver(rates: Record<string, number> = {}) {
  return renderHook(
    () => ({
      resolve: usePayCardWalletCounterValue(),
      trackingPairs: useExtraSessionTrackingPair(),
    }),
    { overrideInitialState: withRates(rates) },
  );
}

function answerCatalogWith(tokens: Record<string, unknown>) {
  jest
    .mocked(useTokenById)
    .mockImplementation(
      (id: string | undefined) => ({ data: id ? tokens[id] : undefined }) as never,
    );
}

describe("usePayCardWalletCounterValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    answerCatalogWith({ [USDC_ID]: USDC, [USDT_ID]: USDT });
  });

  it("prices a token CAL answered with, found by its Ledger id", () => {
    const { result } = renderResolver(USDC_AT_ONE);

    // 12.5 USDC at 1:1, in the counter value's smallest unit.
    expect(result.current.resolve(USDC_ID, "12.5")).toBe(1250);
  });

  it("prices a coin the static registry knows, without asking CAL", () => {
    answerCatalogWith({});
    const { result } = renderResolver(BITCOIN_AT_100K);

    expect(result.current.resolve("bitcoin", "1")).toBe(10_000_000);
  });

  it("leaves a currency neither source knows unpriced", () => {
    const { result } = renderResolver(USDC_AT_ONE);

    expect(result.current.resolve("not/a/currency", "12.5")).toBeNull();
  });

  it("leaves a balance nobody can read unpriced, rather than calling it zero", () => {
    const { result } = renderResolver(USDC_AT_ONE);

    // The parser answers zero for these.
    expect(result.current.resolve(USDC_ID, "")).toBeNull();
    expect(result.current.resolve(USDC_ID, "not a number")).toBeNull();
  });

  it("reads a comma as the decimal separator, as the parser does", () => {
    const { result } = renderResolver(USDC_AT_ONE);

    // `parseCurrencyUnit` normalises the separator, so the guard in front of it must agree.
    expect(result.current.resolve(USDC_ID, "12,5")).toBe(1250);
  });

  it("prices an empty wallet as zero, because zero is an answer", () => {
    const { result } = renderResolver(USDC_AT_ONE);

    expect(result.current.resolve(USDC_ID, "0.00")).toBe(0);
  });

  it("reports no price when the rates have none for the currency", () => {
    const { result } = renderResolver();

    expect(result.current.resolve(USDC_ID, "12.5")).toBeNull();
  });

  it("prices nothing from CAL until it has answered, and still prices a coin", () => {
    answerCatalogWith({});
    const { result } = renderResolver({ ...USDC_AT_ONE, ...BITCOIN_AT_100K });

    expect(result.current.resolve(USDC_ID, "12.5")).toBeNull();
    expect(result.current.resolve("bitcoin", "1")).toBe(10_000_000);
  });

  it("asks CAL for every token the card catalog holds, and for no coin", () => {
    renderResolver();

    const asked = jest
      .mocked(useTokenById)
      .mock.calls.map(([id]) => id)
      .filter((id): id is string => id !== undefined);

    // A token the hook never asks for prices as null forever.
    expect(new Set(asked)).toEqual(new Set(CARD_TOKEN_IDS));
    expect(asked).not.toContain("bitcoin");
  });

  it("registers every card currency against the counter value, so their rates are polled", () => {
    const { result } = renderResolver();

    // A set of pair ids, not the whole list: the subject is a module global. Every currency,
    // not a sample: a missing one prices as null forever.
    const registered = new Set(result.current.trackingPairs.map(pairId));
    const byId = new Map<string, typeof USDC>([USDC, USDT].map(token => [token.id, token]));

    for (const id of CARD_CURRENCY_IDS) {
      const from = findCryptoCurrencyById(id) ?? byId.get(id);
      expect(from).toBeDefined();
      expect(registered).toContain(pairId({ from: from!, to: USD }));
    }
  });

  it("registers a pair once, even when CAL hands back a new object each time", () => {
    const { result, rerender } = renderResolver();
    const registered = result.current.trackingPairs.length;
    expect(registered).toBeGreaterThan(0);

    // Fresh instances: by reference these would register again.
    answerCatalogWith({ [USDC_ID]: { ...USDC }, [USDT_ID]: { ...USDT } });
    rerender(undefined);

    expect(result.current.trackingPairs).toHaveLength(registered);
  });
});
