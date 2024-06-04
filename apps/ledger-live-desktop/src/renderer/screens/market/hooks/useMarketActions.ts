import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "../../stake/constants";
import useStakeFlow from "../../stake";
import { useGetSwapTrackingProperties } from "../../exchange/Swap2/utils";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

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
  const dispatch = useDispatch();
  const history = useHistory();

  const startStakeFlow = useStakeFlow();

  const swapDefaultTrack = useGetSwapTrackingProperties();

  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);

  const { isCurrencyAvailable } = useRampCatalog();

  const internalCurrency = currency?.internalCurrency;

  const openAddAccounts = useCallback(() => {
    if (internalCurrency)
      dispatch(
        openModal("MODAL_ADD_ACCOUNTS", {
          currency: internalCurrency,
          preventSkippingCurrencySelection: true,
        }),
      );
  }, [internalCurrency, dispatch]);

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
            defaultParentAccount:
              "parentId" in defaultAccount && defaultAccount.parentId
                ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
                : null,
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
        currency: currency?.ticker,
        page,
        ...stakeDefaultTrack,
      });
      setTrackingSource(page);
      startStakeFlow({
        currencies: internalCurrency ? [internalCurrency.id] : undefined,
        source: page,
      });
    },
    [internalCurrency, currency?.ticker, page, startStakeFlow],
  );

  const availableOnBuy =
    !!internalCurrency &&
    !!internalCurrency?.id &&
    isCurrencyAvailable(internalCurrency.id, "onRamp");

  const availableOnSwap = !!internalCurrency && currenciesAll?.includes(internalCurrency.id);
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const listFlag = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;
  const availableOnStake =
    stakeProgramsEnabled && listFlag.includes(currency?.internalCurrency?.id || "");

  return {
    openAddAccounts,
    onBuy,
    onSwap,
    onStake,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
  };
};
