import { useCallback, useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  AssetCategory,
  mergeAssetsDataPages,
  useGetAssetsDataInfiniteQuery,
} from "@domain/api-aggregated-assets";
import { selectCurrencyForMetaId } from "@features/platform-aggregated-assets";
import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";
import { useCalculateCountervalueCallback } from "~/actions/general";

const STABLECOIN_CATEGORIES = [AssetCategory.Stablecoins];

/**
 * Values a card-linked custodial wallet in the user's counter-value currency.
 *
 * Baanx names the asset by ticker (`usdc`), so the ticker has to be resolved to a Ledger currency
 * before the countervalue state can price it. The stablecoin catalog is the only resolvable set the
 * Pay tab already loads; a wallet holding anything else resolves to `null`, which the caller reports
 * as a partial total rather than as zero.
 */
export function usePayCardWalletCounterValue(): ResolveWalletCounterValue {
  const version = VersionNumber.appVersion ?? "";
  const calculateCountervalue = useCalculateCountervalueCallback();

  const { data } = useGetAssetsDataInfiniteQuery({
    categories: STABLECOIN_CATEGORIES,
    product: "llm",
    version,
  });

  const currencyByTicker = useMemo(() => {
    const merged = mergeAssetsDataPages(data?.pages);
    const byTicker = new Map<string, CryptoOrTokenCurrency>();
    if (!merged) return byTicker;

    for (const metaId of merged.currenciesOrder.metaCurrencyIds) {
      const ticker = merged.cryptoAssets[metaId]?.ticker?.toUpperCase();
      if (!ticker || byTicker.has(ticker)) continue;

      const currency = selectCurrencyForMetaId(metaId, merged);
      if (currency) byTicker.set(ticker, currency);
    }

    return byTicker;
  }, [data]);

  return useCallback(
    ({ currency }, balance) => {
      const from = currencyByTicker.get(currency.toUpperCase());
      const unit = from?.units[0];
      if (!from || !unit) return null;

      const counterValue = calculateCountervalue(from, parseCurrencyUnit(unit, balance));
      return counterValue ? counterValue.toNumber() : null;
    },
    [currencyByTicker, calculateCountervalue],
  );
}
