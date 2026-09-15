import { useCallback, useEffect, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BAANX_ASSET_LEDGER_IDS } from "@domain/entity-card-asset-mapping";
import { useTokenById } from "@features/platform-currencies";
import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import {
  addExtraSessionTrackingPairs,
  useCalculateCountervalueCallback,
  useExtraSessionTrackingPair,
} from "~/actions/general";

const CARD_CURRENCY_IDS = [
  ...new Set(Object.values(BAANX_ASSET_LEDGER_IDS).filter((id): id is string => id !== undefined)),
];

const CARD_COIN_CURRENCIES = CARD_CURRENCY_IDS.map(id => findCryptoCurrencyById(id)).filter(
  (currency): currency is NonNullable<typeof currency> => currency !== undefined,
);

// One constant per `useTokenById` call: a hook count cannot be derived from a list.
const [FIRST_CARD_TOKEN_ID, SECOND_CARD_TOKEN_ID] = CARD_CURRENCY_IDS.filter(
  id => findCryptoCurrencyById(id) === undefined,
);

/**
 * Prices a card wallet's balance from the Ledger id its asset resolved to, in the counter-value
 * currency's smallest unit. `null` when nothing can price it.
 */
export function usePayCardWalletCounterValue(): ResolveWalletCounterValue {
  const calculateCountervalue = useCalculateCountervalueCallback();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const extraSessionTrackingPairs = useExtraSessionTrackingPair();

  const { data: firstToken } = useTokenById(FIRST_CARD_TOKEN_ID);
  const { data: secondToken } = useTokenById(SECOND_CARD_TOKEN_ID);

  const currencyById = useMemo(() => {
    const byId = new Map<string, CryptoOrTokenCurrency>();

    for (const currency of [...CARD_COIN_CURRENCIES, firstToken, secondToken]) {
      if (currency) byId.set(currency.id, currency);
    }

    return byId;
  }, [firstToken, secondToken]);

  // The app polls rates only for assets the user has an account in, and a card wallet rarely is.
  useEffect(() => {
    const tracked = new Set(extraSessionTrackingPairs.map(pairId));
    const missing = [...currencyById.values()]
      .map(from => ({ from, to: counterValueCurrency, startDate: new Date() }))
      .filter(pair => !tracked.has(pairId(pair)));

    if (missing.length > 0) addExtraSessionTrackingPairs(missing);
  }, [currencyById, counterValueCurrency, extraSessionTrackingPairs]);

  return useCallback(
    (ledgerId, balance) => {
      // The map is keyed by canonical id, which an alias never matches.
      const from = currencyById.get(ledgerId) ?? findCryptoCurrencyById(ledgerId);
      const unit = from?.units[0];
      if (!from || !unit) return null;

      // `parseCurrencyUnit` answers zero for a string it cannot read, which would sink into the
      // total as a real balance.
      if (new BigNumber(balance.replaceAll(",", ".")).isNaN()) return null;

      const counterValue = calculateCountervalue(from, parseCurrencyUnit(unit, balance));
      return counterValue ? counterValue.toNumber() : null;
    },
    [currencyById, calculateCountervalue],
  );
}
