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
import { isAvailableOnBuy, isAvailableOnSwap, isAvailableOnStake } from "../utils";
import { useStake } from "LLD/hooks/useStake";
import {
  ModularDrawerLocation,
  openAssetAndAccountDrawer,
  useModularDrawerVisibility,
} from "LLD/features/ModularDrawer";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getTokenOrCryptoCurrencyById } from "@ledgerhq/live-common/deposit/helper";

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

  const primaryCurrencyId = currency?.ledgerIds?.[0];

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "lldModularDrawer",
  });

  const modularDrawerVisible = isModularDrawerVisible({
    location: ModularDrawerLocation.ADD_ACCOUNT,
  });

  const onAccountSelected = useCallback(
    (account: Account, parentAccount?: Account) => {
      setDrawer();

      history.push({
        pathname: "/swap",
        state: {
          defaultAccount: account,
          defaultAmountFrom: "0",
          from: history.location.pathname,
          defaultParentAccount: parentAccount,
        },
      });
    },
    [history],
  );

  const onAccountSelectedBuy = useCallback(
    (account: Account) => {
      setDrawer();

      history.push({
        pathname: "/exchange",
        state: account.currency.id
          ? {
              currency: account.currency.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                account && account.currency.ticker
                  ? account.currency.ticker.toUpperCase()
                  : undefined,
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
    if (modularDrawerVisible) {
      openAssetAndAccountDrawer({
        currencies: currency?.ledgerIds ?? [],
        onSuccess: (account: AccountLike, parentAccount?: Account) =>
          onAccountSelected(account as Account, parentAccount),
        areCurrenciesFiltered: currency?.ledgerIds && currency?.ledgerIds?.length > 0,
      });
    } else {
      const currencyToUse = getTokenOrCryptoCurrencyById(primaryCurrencyId ?? "");
      if (currencyToUse) {
        openAddAccountFlow(currencyToUse, true, onAccountSelected);
      }
    }
  }, [
    onAccountSelected,
    currency?.ledgerIds,
    modularDrawerVisible,
    openAddAccountFlow,
    primaryCurrencyId,
  ]);

  const openAddAccountsBuy = useCallback(() => {
    if (modularDrawerVisible) {
      openAssetAndAccountDrawer({
        currencies: currency?.ledgerIds ?? [],
        onSuccess: (account: AccountLike) => onAccountSelectedBuy(account as Account),
        areCurrenciesFiltered: currency?.ledgerIds && currency?.ledgerIds?.length > 0,
      });
    } else {
      const currencyToUse = getTokenOrCryptoCurrencyById(primaryCurrencyId ?? "");
      if (currencyToUse) {
        openAddAccountFlow(currencyToUse, true, onAccountSelected);
      }
    }
  }, [
    modularDrawerVisible,
    currency?.ledgerIds,
    onAccountSelectedBuy,
    primaryCurrencyId,
    openAddAccountFlow,
    onAccountSelected,
  ]);

  const onBuy = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource(page);
      // PTX smart routing redirect to live app or to native implementation

      openAddAccountsBuy();
    },
    [page, openAddAccountsBuy],
  );

  /// most likely working (littlle issue with parent account on some coins TBD)
  const onSwap = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (primaryCurrencyId) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked2", {
          button: "swap",
          currency: currency?.ticker,
          page,
          ...swapDefaultTrack,
        });
        setTrackingSource(page);

        const defaultAccount = getAvailableAccountsById(primaryCurrencyId, flattenedAccounts).find(
          Boolean,
        );

        console.log("defaultAccount", defaultAccount);
        console.log("currency", currency);
        console.log("primaryCurrencyId", primaryCurrencyId);
        return openAddAccounts();
      }
    },
    [primaryCurrencyId, currency, page, swapDefaultTrack, flattenedAccounts, openAddAccounts],
  );

  //OK
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

  return {
    onBuy,
    onSwap,
    onStake,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
  };
};
