import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "../../stake/constants";
import useStakeFlow from "../../stake";
import { useGetSwapTrackingProperties } from "../../exchange/Swap2/utils";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { isAvailableOnBuy, isAvailableOnSwap } from "../utils";
import { useStake } from "LLD/hooks/useStake";
import { useModularDrawerVisibility } from "LLD/features/ModularDrawer";
import { AccountLike } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useMarketOnBuy } from "./useMarketOnBuy";
import { useMarketOnSwap } from "./useMarketOnSwap";
import { useMarketOnStake } from "./useMarketOnStake";
import {
  flattenAccounts,
  getMainAccount,
  getParentAccount,
} from "@ledgerhq/coin-framework/account/helpers";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";

export enum Page {
  Market = "Page Market",
  MarketCoin = "Page Market Coin",
}

type MarketActionsProps = {
  currency?: CurrencyData | null;
  page?: Page;
  currenciesAll?: string[];
};

export const useMarketActions = ({ currency, page, currenciesAll }: MarketActionsProps) => {
  const history = useHistory();

  const startStakeFlow = useStakeFlow();

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);

  const { isCurrencyAvailable } = useRampCatalog();

  const currenciesForSwapAllSet = useMemo(() => new Set(currenciesAll), [currenciesAll]);

  const internalCurrency = currency?.internalCurrency;

  const currencyId = useMemo(() => {
    if (!internalCurrency) return undefined;
    return internalCurrency.type === "CryptoCurrency"
      ? internalCurrency.id
      : internalCurrency.parentCurrency?.id;
  }, [internalCurrency]);

  const currenciesArray = useMemo(
    () => (internalCurrency ? [internalCurrency] : []),
    [internalCurrency],
  );

  const onSwapAccountSelected = useCallback(
    (account: AccountLike) => {
      const parentAccount = getParentAccount(account, flattenedAccounts);

      setDrawer();
      history.push({
        pathname: "/swap",
        state: {
          defaultCurrency: internalCurrency,
          defaultAccount: account,
          defaultAmountFrom: "0",
          defaultParentAccount: parentAccount,
          from: history.location.pathname,
        },
      });
    },
    [history, internalCurrency, flattenedAccounts],
  );

  const onBuyAccountSelected = useCallback(
    (account: AccountLike) => {
      const parentAccount = getParentAccount(account, flattenedAccounts);
      const mainAccount = getMainAccount(account, parentAccount);

      setDrawer();
      history.push({
        pathname: "/exchange",
        state: internalCurrency
          ? {
              account: mainAccount.id,
              currency: internalCurrency?.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              account: account.id,
              defaultTicker:
                currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [flattenedAccounts, history, internalCurrency, currency],
  );

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "lldModularDrawer",
  });

  const onBuy = useMarketOnBuy({
    page,
    currencies: currenciesArray,
    isModularDrawerVisible,
    onBuyAccountSelected,
  });

  const onSwap = useMarketOnSwap({
    page,
    currencies: currenciesArray,
    isModularDrawerVisible,
    onSwapAccountSelected,
    swapDefaultTrack,
  });

  const onStake = useMarketOnStake({
    internalCurrency,
    page,
    stakeDefaultTrack,
    startStakeFlow,
    currentPathname: history.location.pathname,
    currencyTicker: currency?.ticker,
  });

  const availableOnBuy = isAvailableOnBuy(currency, isCurrencyAvailable);
  const availableOnSwap = isAvailableOnSwap(currency, currenciesForSwapAllSet);

  const { getCanStakeCurrency } = useStake();

  const availableOnStake = !!currencyId && getCanStakeCurrency(currencyId);

  return {
    onBuy,
    onSwap,
    onStake,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
  };
};
