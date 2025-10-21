import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "../../stake/constants";
import useStakeFlow from "../../stake";
import { useGetSwapTrackingProperties } from "../../exchange/Swap2/utils";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { isAvailableOnBuy, isAvailableOnSwap } from "../utils";
import { useStake } from "LLD/hooks/useStake";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { Account } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";

export enum Page {
  Market = "Page Market",
  MarketCoin = "Page Market Coin",
}

type MarketActionsProps = {
  currency?: CurrencyData | null;
  page?: Page;
};

export const useMarketActions = ({ currency, page }: MarketActionsProps) => {
  const history = useHistory();
  const { data: currenciesAll } = useFetchCurrencyAll();
  const startStakeFlow = useStakeFlow();

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);

  const { isCurrencyAvailable } = useRampCatalog();

  const currenciesForSwapAllSet = useMemo(() => new Set(currenciesAll), [currenciesAll]);

  const internalCurrency = currency?.internalCurrency;

  const onAccountSelected = useCallback(
    (account: Account) => {
      setDrawer();
      history.push({
        pathname: "/swap",
        state: {
          defaultAccount: account,
        },
      });
    },
    [history],
  );

  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "market",
  );

  const openAddAccounts = useCallback(() => {
    if (internalCurrency) openAddAccountFlow(internalCurrency, true, onAccountSelected);
  }, [internalCurrency, onAccountSelected, openAddAccountFlow]);

  const onBuy = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource(page);
      // PTX smart routing redirect to live app or to native implementation

      history.push({
        pathname: "/exchange",
        state: internalCurrency
          ? {
              currency: internalCurrency?.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [currency, history, internalCurrency, page],
  );

  const onSwap = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (internalCurrency?.id) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked2", {
          button: "swap",
          currency: currency?.ticker,
          page,
          ...swapDefaultTrack,
        });
        setTrackingSource(page);

        const currencyId = internalCurrency?.id;

        const defaultAccount = getAvailableAccountsById(currencyId, flattenedAccounts).find(
          Boolean,
        );

        if (!defaultAccount) return openAddAccounts();

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: internalCurrency,
            defaultAccount,
            defaultAmountFrom: "0",
            defaultParentAccount:
              "parentId" in defaultAccount && defaultAccount.parentId
                ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
                : null,
            from: history.location.pathname,
          },
        });
      }
    },
    [
      internalCurrency,
      currency?.ticker,
      page,
      swapDefaultTrack,
      flattenedAccounts,
      openAddAccounts,
      history,
    ],
  );

  const onStake = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      track("button_clicked2", {
        button: "stake",
        currency: internalCurrency ? internalCurrency.ticker : currency?.ticker,
        page,
        ...stakeDefaultTrack,
      });
      setTrackingSource(page);
      startStakeFlow({
        currencies: internalCurrency ? [internalCurrency.id] : undefined,
        source: page,
        returnTo: history.location.pathname,
      });
    },
    [internalCurrency, currency?.ticker, page, startStakeFlow, history.location.pathname],
  );

  const availableOnBuy = useMemo(
    () => isAvailableOnBuy(currency, isCurrencyAvailable),
    [currency, isCurrencyAvailable],
  );
  const availableOnSwap = useMemo(
    () => isAvailableOnSwap(currency, currenciesForSwapAllSet),
    [currency, currenciesForSwapAllSet],
  );

  const { getCanStakeCurrency } = useStake();

  const availableOnStake = useMemo(
    () => !!internalCurrency?.id && getCanStakeCurrency(internalCurrency?.id),
    [internalCurrency, getCanStakeCurrency],
  );

  return {
    onBuy,
    onSwap,
    onStake,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
  };
};
