import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { CardAssetsProps } from "@features/flow-pay-card";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import {
  addExtraSessionTrackingPair,
  useCalculateCountervalueCallback,
  useExtraSessionTrackingPair,
} from "~/actions/general";
import { useFiatFormatter } from "./useFiatFormatter";

const NO_IDS: readonly string[] = [];

export function usePayCardAssets(): CardAssetsProps {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  // Nothing to price until the card is signed in, and the lookups and the polled pairs would be
  // charged to every Pay tab visitor.
  const isSignedIn = useIsCardSignedIn();
  const currencies = useCurrenciesByIds(isSignedIn ? BAANX_LEDGER_CURRENCY_IDS : NO_IDS);
  const trackedPairs = useExtraSessionTrackingPair();

  // The app polls rates only for assets the user has an account in, and a card wallet rarely is.
  useEffect(() => {
    // Compared by `pairId` against what is tracked, because the store compares currencies by
    // reference and a token refetched from CAL comes back as a new object.
    const tracked = new Set(trackedPairs.map(pairId));

    for (const currency of currencies.values()) {
      const pair = { from: currency, to: counterValueCurrency, startDate: new Date() };
      if (tracked.has(pairId(pair))) continue;

      addExtraSessionTrackingPair(pair);
    }
  }, [currencies, counterValueCurrency, trackedPairs]);

  const priceWallet = useCallback(
    (currency: CryptoOrTokenCurrency, balance: string): number | null => {
      const unit = currency.units[0];
      if (!unit) return null;

      // `parseCurrencyUnit` answers zero for a string it cannot read, which would sink into a
      // total as a real balance.
      if (!new BigNumber(balance.replaceAll(",", ".")).isFinite()) return null;

      const countervalue = calculateCountervalue(currency, parseCurrencyUnit(unit, balance));
      return countervalue?.isFinite() ? countervalue.toNumber() : null;
    },
    [calculateCountervalue],
  );

  const formatCountervalue = useFiatFormatter();

  return useMemo(
    () => ({ currencies, priceWallet, formatCountervalue }),
    [currencies, priceWallet, formatCountervalue],
  );
}
