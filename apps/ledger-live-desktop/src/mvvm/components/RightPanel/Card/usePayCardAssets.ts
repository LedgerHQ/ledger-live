import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { CardAssetsProps } from "@features/flow-pay-card-assets";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useFiatFormatter } from "LLD/hooks/useFiatFormatter";
import { useCountervalueFormatter } from "LLD/hooks/useCountervalueFormatter";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { useOnDemandCurrenciesCountervalues } from "~/renderer/hooks/useOnDemandCountervalues";
import { formatCardTransactionAmount } from "./formatCardTransactionAmount";

const NO_IDS: readonly string[] = [];

export function usePayCardAssets(): Omit<CardAssetsProps, "onAddAsset"> {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  // Nothing to price until the card is signed in, and the lookups and the polled pairs would be
  // charged to every visitor.
  const isSignedIn = useIsCardSignedIn();
  const currencies = useCurrenciesByIds(isSignedIn ? BAANX_LEDGER_CURRENCY_IDS : NO_IDS);

  // The app polls rates only for assets the user has an account in, and a card wallet rarely is.
  const cardCurrencies = useMemo(() => [...currencies.values()], [currencies]);
  useOnDemandCurrenciesCountervalues(cardCurrencies, counterValueCurrency);

  const getCounterValue = useCallback(
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
        formatCardTransactionAmount({ value, currency, kind, locale, discreet }),
    }),
    [locale, discreet],
  );

  return useMemo(
    () => ({
      currencies,
      getCounterValue,
      formatCountervalue,
      formatBalance,
      formatters,
      discreet,
    }),
    [currencies, getCounterValue, formatCountervalue, formatBalance, formatters, discreet],
  );
}
