import React, { useCallback } from "react";
import { Flex, Text, Icon } from "@ledgerhq/react-ui";
import { useSelector, useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { starredMarketCoinsSelector, localeSelector } from "~/renderer/reducers/settings";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import styled, { useTheme } from "styled-components";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
import { Button } from "..";
import MarketCoinChart from "./MarketCoinChart";
import MarketInfo from "./MarketInfo";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import useStakeFlow from "../../stake";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";

const CryptoCurrencyIconWrapper = styled.div`
  height: 56px;
  width: 56px;
  position: relative;
  border-radius: 56px;
  overflow: hidden;
  img {
    object-fit: cover;
  }
`;

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
})``;

const StarContainer = styled(Flex).attrs({
  ml: 3,
  pb: 1,
})`
  cursor: pointer;
`;

const Title = styled(Text).attrs({ variant: "h3" })`
  font-size: 28px;
  line-height: 33px;
`;

export default function MarketCoinScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const { currencyId } = useParams<{ currencyId: string }>();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const isStarred = starredMarketCoins.includes(currencyId);
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const { data: currenciesAll } = useFetchCurrencyAll();

  const {
    selectedCoinData: currency,
    chartRequestParams,
    loading,
    loadingChart,
    refreshChart,
    counterCurrency,
    setCounterCurrency,
    supportedCounterCurrencies,
  } = useSingleCoinMarketData();

  const {
    id,
    ticker,
    name,
    image,
    marketcap,
    marketcapRank,
    totalVolume,
    high24h,
    low24h,
    marketCapChangePercentage24h,
    circulatingSupply,
    totalSupply,
    maxSupply,
    ath,
    athDate,
    atl,
    atlDate,
    price,
    priceChangePercentage,
    internalCurrency,
    chartData,
  } = currency || {};

  const { isCurrencyAvailable } = useRampCatalog();

  const availableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");

  const availableOnSwap = internalCurrency && currenciesAll.includes(internalCurrency.id);

  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const listFlag = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;
  const availableOnStake =
    stakeProgramsEnabled &&
    currency?.internalCurrency &&
    listFlag.includes(currency?.internalCurrency?.id);
  const startStakeFlow = useStakeFlow();

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
        state: currency?.internalCurrency
          ? {
              currency: currency.internalCurrency?.id,
              mode: "buy", // buy or sell
            }
          : {
              mode: "onRamp",
              defaultTicker:
                currency && currency.ticker ? currency.ticker.toUpperCase() : undefined,
            },
      });
    },
    [currency, history],
  );

  const openAddAccounts = useCallback(() => {
    if (currency)
      dispatch(
        openModal("MODAL_ADD_ACCOUNTS", {
          currency: currency.internalCurrency,
          preventSkippingCurrencySelection: true,
        }),
      );
  }, [dispatch, currency]);

  const onSwap = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (currency?.internalCurrency?.id) {
        e.preventDefault();
        e.stopPropagation();
        track("button_clicked2", {
          button: "swap",
          currency: currency?.ticker,
          page: "Page Market Coin",
          ...swapDefaultTrack,
        });
        setTrackingSource("Page Market Coin");

        const currencyId = currency?.internalCurrency?.id;

        const defaultAccount = getAvailableAccountsById(currencyId, flattenedAccounts).find(
          Boolean,
        );

        if (!defaultAccount) return openAddAccounts();

        history.push({
          pathname: "/swap",
          state: {
            defaultCurrency: currency.internalCurrency,
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
      currency?.internalCurrency,
      currency?.ticker,
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
        currency: currency?.ticker,
        page: "Page Market Coin",
        ...stakeDefaultTrack,
      });
      setTrackingSource("Page Market Coin");

      startStakeFlow({
        currencies: internalCurrency ? [internalCurrency.id] : undefined,
        source: "Page Market Coin",
      });
    },
    [currency?.ticker, internalCurrency, startStakeFlow],
  );

  const toggleStar = useCallback(() => {
    if (isStarred) {
      id && dispatch(removeStarredMarketCoins(id));
    } else {
      id && dispatch(addStarredMarketCoins(id));
    }
  }, [dispatch, isStarred, id]);

  return currency && counterCurrency ? (
    <Container data-test-id="market-coin-page-container">
      <TrackPage
        category="Page Market Coin"
        currencyName={name}
        starred={isStarred}
        timeframe={chartRequestParams.range}
        countervalue={counterCurrency}
      />
      <Flex flexDirection="row" my={2} alignItems="center" justifyContent="space-between">
        <Flex flexDirection="row" alignItems="center" justifyContent="flex-start">
          <CryptoCurrencyIconWrapper>
            {internalCurrency ? (
              <CryptoCurrencyIcon
                currency={internalCurrency}
                size={56}
                circle
                fallback={<img width="56px" height="56px" src={image} alt={"currency logo"} />}
              />
            ) : (
              <img width="56px" height="56px" src={image} alt={"currency logo"} />
            )}
          </CryptoCurrencyIconWrapper>
          <Flex pl={3} flexDirection="column" alignItems="left" pr={16}>
            <Flex flexDirection="row" alignItems="center" justifyContent={"center"}>
              <Title>{name}</Title>
              <StarContainer data-test-id="market-coin-star-button" onClick={toggleStar}>
                <Icon name={isStarred ? "StarSolid" : "Star"} size={28} />
              </StarContainer>
            </Flex>
            <Text variant="small" color="neutral.c60">
              {ticker?.toUpperCase()}
            </Text>
          </Flex>
        </Flex>
        <Flex flexDirection="row" alignItems="center" justifyContent="flex-end">
          {internalCurrency && (
            <>
              {availableOnBuy && (
                <Button
                  data-test-id="market-coin-buy-button"
                  variant="color"
                  mr={1}
                  onClick={onBuy}
                >
                  {t("accounts.contextMenu.buy")}
                </Button>
              )}
              {availableOnSwap && (
                <Button
                  data-test-id="market-coin-swap-button"
                  variant="color"
                  onClick={onSwap}
                  mr={1}
                >
                  {t("accounts.contextMenu.swap")}
                </Button>
              )}
              {availableOnStake && (
                <Button variant="color" onClick={onStake} data-test-id="market-coin-stake-button">
                  {t("accounts.contextMenu.stake")}
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
      <MarketCoinChart
        price={price}
        priceChangePercentage={priceChangePercentage}
        chartData={chartData}
        chartRequestParams={chartRequestParams}
        refreshChart={refreshChart}
        color={color}
        t={t}
        locale={locale}
        loading={loadingChart}
        setCounterCurrency={setCounterCurrency}
        supportedCounterCurrencies={supportedCounterCurrencies}
      />
      <MarketInfo
        marketcap={marketcap}
        marketcapRank={marketcapRank}
        totalVolume={totalVolume}
        high24h={high24h}
        low24h={low24h}
        price={price}
        priceChangePercentage={priceChangePercentage}
        marketCapChangePercentage24h={marketCapChangePercentage24h}
        circulatingSupply={circulatingSupply}
        totalSupply={totalSupply}
        maxSupply={maxSupply}
        ath={ath}
        athDate={athDate}
        atl={atl}
        atlDate={atlDate}
        locale={locale}
        counterCurrency={counterCurrency}
        loading={loading}
      />
    </Container>
  ) : null;
}
