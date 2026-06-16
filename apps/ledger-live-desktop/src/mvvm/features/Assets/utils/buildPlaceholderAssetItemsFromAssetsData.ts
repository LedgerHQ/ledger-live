import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import type { AssetTableItem } from "../types";

function toPlaceholderItem(currency: CryptoOrTokenCurrency, marketId: string): AssetTableItem {
  return {
    currency,
    balance: 0,
    value: 0,
    distribution: 0,
    accounts: [],
    isPlaceholder: true,
    marketId,
  };
}

/**
 * Builds placeholder rows from DADA assets data (home / crypto-assets empty & padding states).
 */
export function buildPlaceholderAssetItemsFromAssetsData(
  assetsData: AssetsDataWithPagination,
  stablecoinTickers: Set<string>,
): { cryptos: AssetTableItem[]; stablecoins: AssetTableItem[] } {
  const cryptos: AssetTableItem[] = [];
  const stablecoins: AssetTableItem[] = [];

  for (const id of assetsData.currenciesOrder.metaCurrencyIds) {
    const currency = selectCurrencyForMetaId(id, assetsData);
    if (!currency) continue;

    const ticker = assetsData.cryptoAssets[id]?.ticker?.toUpperCase() ?? "";
    const { id: marketId } = assetsData.markets?.[currency.id] ?? {};
    const item = toPlaceholderItem(currency, marketId ?? id);

    if (stablecoinTickers.has(ticker)) {
      stablecoins.push(item);
    } else {
      cryptos.push(item);
    }
  }

  return { cryptos, stablecoins };
}
