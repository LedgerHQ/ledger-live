import { useSelector, useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { starredMarketCoinsSelector, localeSelector } from "~/renderer/reducers/settings";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCallback, useMemo, useState } from "react";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { openModal } from "~/renderer/actions/modals";
import { track } from "~/renderer/analytics/segment";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { stakeDefaultTrack } from "../../stake/constants";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import useStakeFlow from "../../stake";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useTheme } from "styled-components";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  useCurrencyChartData,
  useCurrencyData,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";

const ranges = Object.keys(rangeDataTable);
export const useMarketCoin = () => {
  const [range, setRange] = useState<string>("24h");
  const [counterCurrency, setCounterCurrency] = useState("usd");
  const { colors } = useTheme();
  const history = useHistory();
  const dispatch = useDispatch();
  const { currencyId } = useParams<{ currencyId: string }>();

  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);

  const isStarred = starredMarketCoins.includes(currencyId);
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const { data: currenciesAll } = useFetchCurrencyAll();

  const { isCurrencyAvailable } = useRampCatalog();
  const startStakeFlow = useStakeFlow();

  const resCurrencyChartData = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    ranges,
  });

  const { currencyDataByRanges, currencyInfo } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    ranges,
  });

  const dataChart = useMemo(
    () => resCurrencyChartData?.[ranges.indexOf(range)].data,
    [range, resCurrencyChartData],
  );
  const isLoadingDataChart = useMemo(
    () => resCurrencyChartData?.[ranges.indexOf(range)].isLoading,
    [range, resCurrencyChartData],
  );

  const dataCurrency = useMemo(
    () => currencyDataByRanges?.[ranges.indexOf(range)].data,
    [range, currencyDataByRanges],
  );

  const isLoadingData = useMemo(
    () => currencyDataByRanges?.[ranges.indexOf(range)].isLoading,
    [range, currencyDataByRanges],
  );

  const currency = useMemo(() => currencyInfo?.data, [currencyInfo]);

  const { id, internalCurrency } = currency || {};

  const availableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");

  const availableOnSwap = internalCurrency && currenciesAll.includes(internalCurrency.id);

  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const listFlag = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;
  const availableOnStake =
    stakeProgramsEnabled &&
    dataCurrency?.internalCurrency &&
    listFlag.includes(dataCurrency?.internalCurrency?.id);

  const color = internalCurrency
    ? getCurrencyColor(internalCurrency, colors.background.main)
    : colors.primary.c80;

  const onBuy = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource("Page Market Coin");

      history.push({
        pathname: "/exchange",
        state: dataCurrency?.internalCurrency
          ? {
              dataCurrency: dataCurrency.internalCurrency?.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                dataCurrency && dataCurrency.ticker ? dataCurrency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [dataCurrency, history],
  );

  const openAddAccounts = useCallback(() => {
    if (dataCurrency)
      dispatch(
        openModal("MODAL_ADD_ACCOUNTS", {
          currency: dataCurrency.internalCurrency,
          preventSkippingCurrencySelection: true,
        }),
      );
  }, [dispatch, dataCurrency]);

  const onSwap = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (dataCurrency?.internalCurrency?.id) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked2", {
          button: "swap",
          dataCurrency: dataCurrency?.ticker,
          page: "Page Market Coin",
          ...swapDefaultTrack,
        });
        setTrackingSource("Page Market Coin");

        const currencyId = dataCurrency?.internalCurrency?.id;

        const defaultAccount = getAvailableAccountsById(currencyId, flattenedAccounts).find(
          Boolean,
        );

        if (!defaultAccount) return openAddAccounts();

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: dataCurrency.internalCurrency,
            defaultAccount,
            defaultParentAccount:
              "parentId" in defaultAccount && defaultAccount?.parentId
                ? flattenedAccounts.find(a => a.id === defaultAccount.parentId)
                : null,
          },
        });
      }
    },
    [
      dataCurrency?.internalCurrency,
      dataCurrency?.ticker,
      flattenedAccounts,
      history,
      openAddAccounts,
      swapDefaultTrack,
    ],
  );

  const onStake = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      track("button_clicked2", {
        button: "stake",
        dataCurrency: dataCurrency?.ticker,
        page: "Page Market Coin",
        ...stakeDefaultTrack,
      });
      setTrackingSource("Page Market Coin");

      startStakeFlow({
        currencies: internalCurrency ? [internalCurrency.id] : undefined,
        source: "Page Market Coin",
      });
    },
    [dataCurrency?.ticker, internalCurrency, startStakeFlow],
  );

  const toggleStar = useCallback(() => {
    if (isStarred) {
      id && dispatch(removeStarredMarketCoins(id));
    } else {
      id && dispatch(addStarredMarketCoins(id));
    }
  }, [dispatch, isStarred, id]);

  const changeRange = useCallback((range: string) => {
    setRange(range);
  }, []);

  const changeCounterCurrency = useCallback((currency: string) => {
    setCounterCurrency(currency);
  }, []);

  return {
    isStarred,
    locale,
    flattenedAccounts,
    swapDefaultTrack,
    currencies: currenciesAll,
    onBuy,
    onStake,
    onSwap,
    toggleStar,
    color,
    availableOnBuy,
    availableOnSwap,
    availableOnStake,
    dataCurrency,
    dataChart,
    isLoadingDataChart,
    isLoadingData,
    changeRange,
    range,
    counterCurrency,
    changeCounterCurrency,
    currency,
  };
};
