// Consumers such as wallet-pnl read the countervalues state this package builds through the helpers of
// @domain/entity-market-countervalues. That works only while both copies key pairs the same way: a change
// to one copy alone makes lookups miss silently, which for wallet-pnl means a stale cached cost basis.
// These tests use the full currency registries so an alias added to only one copy is caught.
// Delete this file together with this package.
import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import { listFiatCurrencies } from "@domain/entity-currency-fiat";
import {
  formatCounterValueDay as entityFormatCounterValueDay,
  historyKey as entityHistoryKey,
  inferCurrencyAPIID as entityInferCurrencyAPIID,
  lenseRateMap as entityLenseRateMap,
  pairId as entityPairId,
} from "@domain/entity-market-countervalues";
import type { Currency, TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import { formatCounterValueDay, inferCurrencyAPIID, pairId } from "./helpers";
import { importCountervalues, lenseRateMap } from "./logic";

const token: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  delisted: false,
  disableCountervalue: false,
};

const cryptos: Currency[] = listCryptoCurrencies(true);
const fiats: Currency[] = listFiatCurrencies();
const assets: Currency[] = [...cryptos, token];

describe("parity with @domain/entity-market-countervalues", () => {
  test("covers the currencies whose API id is an alias", () => {
    expect(cryptos.map(c => (c.type === "FiatCurrency" ? c.ticker : c.id))).toEqual(
      expect.arrayContaining(["assethub_polkadot", "concordium_testnet"]),
    );
    expect(fiats.length).toBeGreaterThan(100);
  });

  test("both copies give every currency the same API id", () => {
    const mismatches = [...assets, ...fiats]
      .filter(c => inferCurrencyAPIID(c) !== entityInferCurrencyAPIID(c))
      .map(c => `${c.type}:${c.type === "FiatCurrency" ? c.ticker : c.id}`);

    expect(mismatches).toEqual([]);
  });

  test("both copies key every asset and fiat pair the same way, in both directions", () => {
    const mismatches: string[] = [];
    for (const asset of assets) {
      for (const fiat of fiats) {
        for (const pair of [
          { from: asset, to: fiat },
          { from: fiat, to: asset },
        ]) {
          if (pairId(pair) !== entityPairId(pair)) mismatches.push(pairId(pair));
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  test("both copies bucket dates into the same day", () => {
    const dates = [
      "2024-02-29T00:00:00.000Z",
      "2024-12-31T23:59:59.999Z",
      "2025-01-01T00:00:00.000Z",
      "2025-03-30T01:30:00.000Z",
      "2025-10-26T23:00:00.000Z",
    ].map(iso => new Date(iso));

    for (const d of dates) expect(entityFormatCounterValueDay(d)).toBe(formatCounterValueDay(d));
  });

  test("the entity finds every pair this package files, and fingerprints it", () => {
    const quoted = fiats.filter(
      f => f.type === "FiatCurrency" && ["USD", "EUR"].includes(f.ticker),
    );
    const pairs = assets.flatMap(from => quoted.map(to => ({ from, to })));
    const raw: Record<string, unknown> = { status: {} };
    for (const pair of pairs) raw[pairId(pair)] = { "2025-01-01": 1, latest: 2 };
    const state = importCountervalues(raw as Parameters<typeof importCountervalues>[0], {
      trackingPairs: [],
      autofillGaps: false,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
    });

    const missed = pairs.filter(pair => {
      const filed = lenseRateMap(state, pair);
      return !filed || entityLenseRateMap(state, pair) !== filed;
    });
    const unfingerprinted = pairs.filter(
      ({ from, to }) => entityHistoryKey(state, from, to, new Date("2025-06-01")) === "noCV",
    );

    expect(pairs.length).toBeGreaterThan(0);
    expect(missed.map(p => pairId(p))).toEqual([]);
    expect(unfingerprinted.map(p => pairId(p))).toEqual([]);
  });
});
