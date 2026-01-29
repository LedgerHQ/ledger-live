import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "../../../../renderer/screens/stake/constants";
import useStakeFlow from "../../../../renderer/screens/stake";
import { useGetSwapTrackingProperties } from "../../../../renderer/screens/exchange/Swap2/utils";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import {
  isAvailableOnBuy,
  isAvailableOnStake,
  isAvailableOnSwap,
} from "../../../../renderer/screens/market/utils";
import { useStake } from "LLD/hooks/useStake";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useLazyLedgerCurrency } from "@ledgerhq/live-common/dada-client/hooks/useLazyLedgerCurrency";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildSwapNavigationState } from "../utils/swapNavigation";

export enum Page {
  Market = "Page Market",
  MarketCoin = "Page Market Coin",
}

type MarketActionsProps = {
  currency?: MarketCurrencyData | null;
  page?: Page;
};

export const useMarketActions = ({ currency, page }: MarketActionsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: currenciesAll } = useFetchCurrencyAll();
  const startStakeFlow = useStakeFlow();

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);

  const { isCurrencyAvailable } = useRampCatalog();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

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

      const ledgerCurrency = await getLedgerCurrency();

      navigate("/exchange", {
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
    [currency, navigate, getLedgerCurrency, page],
  );

  const onSwap = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const ledgerCurrency = await getLedgerCurrency();
      if (!ledgerCurrency?.id) return;

      track("button_clicked2", {
        button: "swap",
        currency: currency?.ticker,
        page,
        ...swapDefaultTrack,
      });
      setTrackingSource(page);

      const fromPath = location.pathname;
      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);
      const hasAccounts = availableAccounts.length > 0;

      if (!hasAccounts) {
        navigate("/swap", {
          state: buildSwapNavigationState({ currency: ledgerCurrency, fromPath }),
        });
        return;
      }

      if (availableAccounts.length === 1) {
        const account = availableAccounts[0];
        const parentAccount = isTokenAccount(account)
          ? allAccounts.find(a => a.id === account.parentId)
          : undefined;

        navigate("/swap", {
          state: buildSwapNavigationState({
            currency: ledgerCurrency,
            fromPath,
            account,
            parentAccount,
          }),
        });
        return;
      }

      openAssetAndAccount({
        currencies: [ledgerCurrency.id],
        areCurrenciesFiltered: true,
        useCase: "swap",
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/swap", {
            state: buildSwapNavigationState({
              currency: ledgerCurrency,
              fromPath,
              account,
              parentAccount,
            }),
          });
        },
        onCancel: () => {},
      });
    },
    [
      getLedgerCurrency,
      currency?.ticker,
      page,
      swapDefaultTrack,
      navigate,
      location.pathname,
      flattenedAccounts,
      allAccounts,
      openAssetAndAccount,
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
        returnTo: location.pathname,
      });
    },
    [getLedgerCurrency, currency?.ticker, page, startStakeFlow, location.pathname],
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
