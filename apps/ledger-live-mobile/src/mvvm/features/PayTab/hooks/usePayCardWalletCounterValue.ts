import { useCallback, useEffect, useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BAANX_ASSET_LEDGER_IDS } from "@domain/entity-card-asset-mapping";
import {
  AssetCategory,
  mergeAssetsDataPages,
  useGetAssetsDataInfiniteQuery,
} from "@domain/api-aggregated-assets";
import { selectCurrencyForMetaId } from "@features/platform-aggregated-assets";
import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import {
  addExtraSessionTrackingPair,
  useCalculateCountervalueCallback,
  useTrackingPairs,
} from "~/actions/general";

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
 *
 * The rates the app polls cover the assets the user holds an account in, and a card wallet is
 * usually none of them, so every card asset is registered as a tracking pair here. Without that a
 * held asset prices and the rest report nothing, which reads as a broken mapping rather than as a
 * rate the app never asked for.
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

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const trackingPairs = useTrackingPairs();
  const { poll } = useCountervaluesPolling();

  const cardCurrencies = useMemo(() => {
    const ids = new Set(Object.values(BAANX_ASSET_LEDGER_IDS));
    return [...ids]
      .map(id => tokenById.get(id) ?? findCryptoCurrencyById(id))
      .filter((currency): currency is CryptoOrTokenCurrency => currency !== undefined);
  }, [tokenById]);

  useEffect(() => {
    const missing = cardCurrencies.filter(
      currency =>
        !trackingPairs.some(pair => pair.from === currency && pair.to === counterValueCurrency),
    );
    if (missing.length === 0) return;

    for (const currency of missing) {
      addExtraSessionTrackingPair({
        from: currency,
        to: counterValueCurrency,
        startDate: new Date(),
      });
    }

    // Polling is debounced on the countervalue user settings, so give the additions a moment to
    // land before asking for the rates.
    const timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, [cardCurrencies, trackingPairs, counterValueCurrency, poll]);

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
