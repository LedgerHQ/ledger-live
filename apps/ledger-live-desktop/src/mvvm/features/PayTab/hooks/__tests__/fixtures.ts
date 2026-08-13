import { makeToken } from "@ledgerhq/asset-aggregation/assetCategorization/__tests__/fixtures";
import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import type { Unit } from "@domain/entity-currency-unit";
import type { DefaultStablecoin } from "@features/platform-aggregated-assets";

export const USD_UNIT: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };

export const USDC: DefaultStablecoin = {
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  name: "USD Coin",
  magnitude: 6,
};

export const USDT: DefaultStablecoin = {
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  name: "Tether USD",
  magnitude: 6,
};

export function makeItem(
  id: string,
  ticker: string,
  name: string,
  value: number,
): CategorizedAssetItem {
  return {
    currency: makeToken(id, ticker, name, 6),
    balance: value * 1_000_000,
    value,
    distribution: 0,
    accounts: [],
  };
}
