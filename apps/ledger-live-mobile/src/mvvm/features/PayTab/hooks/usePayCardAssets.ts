import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardAssetsProps } from "@features/flow-pay-card-assets";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { addExtraSessionTrackingPairs, useCalculateCountervalueCallback } from "~/actions/general";
import { formatCardTransactionAmount } from "LLM/features/OperationsHistory/utils/formatCardTransactionAmount";
import { useCountervalueFormatter } from "./useCountervalueFormatter";
import { useFiatFormatter } from "./useFiatFormatter";

const NO_IDS: readonly string[] = [];

export function usePayCardAssets(): CardAssetsProps {
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  // Nothing to price until the card is signed in, and the lookups and the polled pairs would be
  // charged to every Pay tab visitor.
  const isSignedIn = useIsCardSignedIn();
  const currencies = useCurrenciesByIds(isSignedIn ? BAANX_LEDGER_CURRENCY_IDS : NO_IDS);

  // The app polls rates only for assets the user has an account in, and a card wallet rarely is.
  // Handed over as one set: a call per currency would notify every subscriber that many times.
  useEffect(() => {
    const startDate = new Date();
    const pairs = [...currencies.values()].map(currency => ({
      from: currency,
      to: counterValueCurrency,
      startDate,
    }));

    addExtraSessionTrackingPairs(pairs);
  }, [currencies, counterValueCurrency]);

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
  const formatBalance = useCountervalueFormatter();
  const formatters = useMemo<CardTransactionFormatters>(
    () => ({
      amount: (value, currency, kind) =>
        formatCardTransactionAmount({ value, currency, kind, locale }),
    }),
    [locale],
  );

  return useMemo(
    () => ({ currencies, priceWallet, formatCountervalue, formatBalance, formatters }),
    [currencies, priceWallet, formatCountervalue, formatBalance, formatters],
  );
}
