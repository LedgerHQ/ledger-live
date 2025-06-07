import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getBalanceAndFiatValueByAssets } from "../../../utils/getBalanceAndFiatValueByAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export const useRightBalanceModule = (assets: CryptoOrTokenCurrency[]) => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const assetsToDisplayWithDrawerConfig = getBalanceAndFiatValueByAssets(
    flattenedAccounts,
    assets,
    state,
    counterValueCurrency,
    discreet,
    locale,
  );

  return assetsToDisplayWithDrawerConfig;
};
