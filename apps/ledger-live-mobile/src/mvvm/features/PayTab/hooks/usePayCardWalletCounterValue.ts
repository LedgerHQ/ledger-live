import { useCallback, useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
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
 * Values a card-linked wallet's balance in the user's counter-value currency.
 *
 * The wallet arrives already resolved to a Ledger currency id, so this only has to turn that id
 * into a currency the countervalue state can price. Coins come from the static registry; tokens
 * come from the stablecoin catalog the Pay tab already loads, which covers the card's two.
 *
 * A currency neither source knows prices to `null`, which the caller shows as unpriced rather than
 * as zero.
 */
export function usePayCardWalletCounterValue(): ResolveWalletCounterValue {
  const version = VersionNumber.appVersion ?? "";
  const calculateCountervalue = useCalculateCountervalueCallback();

  const { data } = useGetAssetsDataInfiniteQuery({
    categories: STABLECOIN_CATEGORIES,
    product: "llm",
    version,
  });

  const tokenById = useMemo(() => {
    const merged = mergeAssetsDataPages(data?.pages);
    const byId = new Map<string, CryptoOrTokenCurrency>();
    if (!merged) return byId;

    for (const metaId of merged.currenciesOrder.metaCurrencyIds) {
      const currency = selectCurrencyForMetaId(metaId, merged);
      if (currency) byId.set(currency.id, currency);
    }

    return byId;
  }, [data]);

  return useCallback(
    (ledgerId, balance) => {
      const from = tokenById.get(ledgerId) ?? findCryptoCurrencyById(ledgerId);
      const unit = from?.units[0];
      if (!from || !unit) return null;

      const counterValue = calculateCountervalue(from, parseCurrencyUnit(unit, balance));
      return counterValue ? counterValue.toNumber() : null;
    },
    [tokenById, calculateCountervalue],
  );
}
