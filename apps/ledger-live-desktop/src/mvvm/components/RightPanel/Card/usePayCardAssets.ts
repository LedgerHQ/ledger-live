import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { CardAssetsProps } from "@features/flow-pay-card-assets";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useFiatFormatter } from "LLD/hooks/useFiatFormatter";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { useOnDemandCurrenciesCountervalues } from "~/renderer/hooks/useOnDemandCountervalues";

const NO_IDS: readonly string[] = [];

export function usePayCardAssets(): CardAssetsProps {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback();
  // Nothing to price until the card is signed in, and the lookups and the polled pairs would be
  // charged to every visitor.
  const isSignedIn = useIsCardSignedIn();
  const currencies = useCurrenciesByIds(isSignedIn ? BAANX_LEDGER_CURRENCY_IDS : NO_IDS);

  // The app polls rates only for assets the user has an account in, and a card wallet rarely is.
  const cardCurrencies = useMemo(() => [...currencies.values()], [currencies]);
  useOnDemandCurrenciesCountervalues(cardCurrencies, counterValueCurrency);

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
