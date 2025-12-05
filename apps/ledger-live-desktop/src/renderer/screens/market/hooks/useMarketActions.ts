import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
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
import { isAvailableOnBuy, isAvailableOnStake, isAvailableOnSwap } from "../utils";
import { useStake } from "LLD/hooks/useStake";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useLazyLedgerCurrency } from "@ledgerhq/live-common/dada-client/hooks/useLazyLedgerCurrency";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";

export enum Page {
  Market = "Page Market",
  MarketCoin = "Page Market Coin",
}

type MarketActionsProps = {
  currency?: MarketCurrencyData | null;
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

  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const isCurrencySupported =
    currency?.ledgerIds.some(lrId => !deactivatedCurrencyIds.has(lrId)) || false;
  const { getLedgerCurrency } = useLazyLedgerCurrency(
    {
      product: "lld",
      version: __APP_VERSION__,
    },
    currency,
  );

  const onAccountSelected = useCallback(
    (account: Account | TokenAccount, parentAccount?: Account) => {
      setDrawer();
      // For token accounts, we use the token account directly
      // The swap should handle TokenAccount properly
      history.push({
        pathname: "/swap",
        state: {
          defaultAccount: account,
          defaultParentAccount: parentAccount,
        },
      });
    },
    [history],
  );

  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "market",
  );

  const openAddAccounts = useCallback(async () => {
    const ledgerCurrency = await getLedgerCurrency();
    if (ledgerCurrency) openAddAccountFlow(ledgerCurrency, true, onAccountSelected);
  }, [getLedgerCurrency, onAccountSelected, openAddAccountFlow]);

  const onBuy = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource(page);
      // PTX smart routing redirect to live app or to native implementation

      const ledgerCurrency = await getLedgerCurrency();

      history.push({
        pathname: "/exchange",
        state: ledgerCurrency
          ? {
              currency: ledgerCurrency?.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [currency, history, getLedgerCurrency, page],
  );

  const onSwap = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const ledgerCurrency = await getLedgerCurrency();

      if (ledgerCurrency?.id) {
        track("button_clicked2", {
          button: "swap",
          currency: currency?.ticker,
          page,
          ...swapDefaultTrack,
        });
        setTrackingSource(page);

        const currencyId = ledgerCurrency?.id;

        const defaultAccount = getAvailableAccountsById(currencyId, flattenedAccounts).find(
          Boolean,
        );

        if (!defaultAccount) return openAddAccounts();

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: ledgerCurrency,
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
      getLedgerCurrency,
      currency?.ticker,
      page,
      swapDefaultTrack,
      flattenedAccounts,
      openAddAccounts,
      history,
    ],
  );

  const onStake = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const ledgerCurrency = await getLedgerCurrency();

      track("button_clicked2", {
        button: "stake",
        currency: ledgerCurrency ? ledgerCurrency.ticker : currency?.ticker,
        page,
        ...stakeDefaultTrack,
      });
      setTrackingSource(page);
      startStakeFlow({
        currencies: ledgerCurrency ? [ledgerCurrency.id] : undefined,
        source: page,
        returnTo: history.location.pathname,
      });
    },
    [getLedgerCurrency, currency?.ticker, page, startStakeFlow, history.location.pathname],
  );

  const availableOnBuy = useMemo(
    () => isCurrencySupported && isAvailableOnBuy(currency, isCurrencyAvailable),
    [currency, isCurrencyAvailable, isCurrencySupported],
  );
  const availableOnSwap = useMemo(
    () => isCurrencySupported && isAvailableOnSwap(currency, currenciesForSwapAllSet),
    [currency, currenciesForSwapAllSet, isCurrencySupported],
  );

  const { getCanStakeCurrency } = useStake();

  const availableOnStake = useMemo(
    () => isCurrencySupported && isAvailableOnStake(currency, getCanStakeCurrency),
    [currency, getCanStakeCurrency, isCurrencySupported],
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
