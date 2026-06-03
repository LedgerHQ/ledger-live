import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { resolveNetworkLedgerIds } from "../useReceiveNetworkLedgerIds";

const TETHER_META_ID = "urn:crypto:meta-currency:tether";
const USD_COIN_META_ID = "urn:crypto:meta-currency:usd_coin";

const TETHER_LEDGER_IDS = {
  ethereum: "ethereum/erc20/usd_tether__erc20_",
  tron: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
  polygon: "polygon/erc20/_pos__tether_usd",
};
const USD_COIN_LEDGER_IDS = {
  ethereum: "ethereum/erc20/usd_coin",
  polygon: "polygon/erc20/usd_coin",
  base: "base/erc20/usd_base_coin",
};

const data = {
  cryptoAssets: {
    [TETHER_META_ID]: {
      id: TETHER_META_ID,
      ticker: "USDT",
      name: "Tether USD",
      assetsIds: TETHER_LEDGER_IDS,
    },
    [USD_COIN_META_ID]: {
      id: USD_COIN_META_ID,
      ticker: "USDC",
      name: "USD Coin",
      assetsIds: USD_COIN_LEDGER_IDS,
    },
  },
} as unknown as AssetsDataWithPagination;

describe("resolveNetworkLedgerIds", () => {
  it("returns [] when no data is available yet", () => {
    expect(resolveNetworkLedgerIds(undefined, { metaCurrencyId: TETHER_META_ID })).toEqual([]);
  });

  it("resolves by exact meta-currency id (held asset)", () => {
    expect(resolveNetworkLedgerIds(data, { metaCurrencyId: TETHER_META_ID })).toEqual(
      Object.values(TETHER_LEDGER_IDS),
    );
  });

  it("resolves by market slug when the exact meta id is missing (not held)", () => {
    expect(resolveNetworkLedgerIds(data, { marketApiId: "usd-coin" })).toEqual(
      Object.values(USD_COIN_LEDGER_IDS),
    );
  });

  it("falls back to scanning by a known currency id", () => {
    expect(resolveNetworkLedgerIds(data, { currencyId: "polygon/erc20/_pos__tether_usd" })).toEqual(
      Object.values(TETHER_LEDGER_IDS),
    );
  });

  it("prefers the market slug match over the currency id scan", () => {
    expect(
      resolveNetworkLedgerIds(data, {
        marketApiId: "usd-coin",
        currencyId: "ethereum/erc20/usd_tether__erc20_",
      }),
    ).toEqual(Object.values(USD_COIN_LEDGER_IDS));
  });

  it("returns [] when no hint matches", () => {
    expect(
      resolveNetworkLedgerIds(data, { marketApiId: "unknown", currencyId: "unknown" }),
    ).toEqual([]);
  });
});
