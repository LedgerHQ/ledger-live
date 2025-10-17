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
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { isAvailableOnBuy, isAvailableOnSwap, isAvailableOnStake } from "../utils";
import { useStake } from "LLD/hooks/useStake";
import { openAssetAndAccountDrawer } from "LLD/features/ModularDrawer";
import { AccountLike } from "@ledgerhq/types-live";
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
  const { getCanStakeCurrency } = useStake();

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);

  const { isCurrencyAvailable } = useRampCatalog();

  const currenciesForSwapAllSet = useMemo(() => new Set(currenciesAll), [currenciesAll]);

  const availableOnBuy = useMemo(
    () => isAvailableOnBuy(currency, isCurrencyAvailable),
    [currency, isCurrencyAvailable],
  );
  const availableOnSwap = useMemo(
    () => isAvailableOnSwap(currency, currenciesForSwapAllSet),
    [currency, currenciesForSwapAllSet],
  );

  const availableOnStake = useMemo(
    () => isAvailableOnStake(currency, getCanStakeCurrency),
    [currency, getCanStakeCurrency],
  );

  const onAccountSelected = useCallback(
    (account: AccountLike) => {
      setDrawer();

      const defaultAccount = getAvailableAccountsById(
        getAccountCurrency(account)?.id ?? "",
        flattenedAccounts,
      ).find(Boolean);

      history.push({
        pathname: "/swap",
        state: {
          defaultAccount: defaultAccount,
          defaultAmountFrom: "0",
          from: history.location.pathname,
          defaultParentAccount:
            defaultAccount && "parentId" in defaultAccount && defaultAccount.parentId
              ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
              : null,
        },
      });
    },
    [history, flattenedAccounts],
  );

  const onAccountSelectedBuy = useCallback(
    (account: AccountLike) => {
      setDrawer();

      const currency = getAccountCurrency(account);
      history.push({
        pathname: "/exchange",
        state: currency.id
          ? {
              currency: currency.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [history],
  );

  const openAddAccountsForSwap = useCallback(() => {
    openAssetAndAccountDrawer({
      currencies: currency?.ledgerIds ?? [],
      onSuccess: onAccountSelected,
      areCurrenciesFiltered: currency?.ledgerIds && currency?.ledgerIds?.length > 0,
      useCase: "swap",
    });
  }, [currency?.ledgerIds, onAccountSelected]);

  const openAddAccountsForBuy = useCallback(() => {
    openAssetAndAccountDrawer({
      currencies: currency?.ledgerIds ?? [],
      onSuccess: (account: AccountLike) => onAccountSelectedBuy(account),
      areCurrenciesFiltered: currency?.ledgerIds && currency?.ledgerIds?.length > 0,
      useCase: "buy",
    });
  }, [currency?.ledgerIds, onAccountSelectedBuy]);

  const onBuy = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource(page);

      openAddAccountsForBuy();
    },
    [page, openAddAccountsForBuy],
  );

  const onSwap = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (availableOnSwap) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked2", {
          button: "swap",
          currency: currency?.ticker,
          page,
          ...swapDefaultTrack,
        });
        setTrackingSource(page);

        return openAddAccountsForSwap();
      }
    },
    [availableOnSwap, currency, page, swapDefaultTrack, openAddAccountsForSwap],
  );

  const onStake = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      track("button_clicked2", {
        button: "stake",
        currency: currency?.ticker,
        page,
        ...stakeDefaultTrack,
      });
      setTrackingSource(page);
      startStakeFlow({
        currencies: currency?.ledgerIds ?? [],
        source: page,
        returnTo: history.location.pathname,
      });
    },
    [currency?.ledgerIds, currency?.ticker, page, startStakeFlow, history.location.pathname],
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
