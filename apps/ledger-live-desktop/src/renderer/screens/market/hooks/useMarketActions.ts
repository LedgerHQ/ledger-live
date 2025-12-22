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

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: ledgerCurrency,
            defaultAccount,
            defaultAmountFrom: "0",
            defaultParentAccount:
              defaultAccount && "parentId" in defaultAccount && defaultAccount.parentId
                ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
                : null,
            from: history.location.pathname,
          },
        });
      }
    },
    [getLedgerCurrency, currency?.ticker, page, swapDefaultTrack, flattenedAccounts, history],
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
