import React from "react";
import { Flex, Text, Icon, InfiniteLoader } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { localeSelector } from "~/renderer/reducers/settings";
import styled from "styled-components";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Button } from "..";
import MarketCoinChart from "./components/MarketCoinChart";
import MarketInfo from "./components/MarketInfo";
import { useMarketCoin } from "~/renderer/screens/market/hooks/useMarketCoin";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

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
  const locale = useSelector(localeSelector);

  const {
    isStarred,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
    color,
    dataChart,
    isLoadingDataChart,
    isLoadingCurrency,
    range,
    counterCurrency,
    currency,
    supportedCounterCurrencies,
    changeRange,
    onSwap,
    onBuy,
    onStake,
    toggleStar,
    changeCounterCurrency,
  } = useMarketCoin();

  const earnStakeLabelCoin = useGetStakeLabelLocaleBased();

  const { name, ticker, image, internalCurrency, price } = currency || {};

  const currentPriceChangePercentage = currency?.priceChangePercentage[range as KeysPriceChange];

  return (
    <Container data-testid="market-coin-page-container">
      <TrackPage
        category="Page Market Coin"
        currencyName={name}
        starred={isStarred}
        timeframe={range}
        countervalue={counterCurrency}
      />
      <Flex flexDirection="row" my={2} alignItems="center" justifyContent="space-between">
        <Flex flexDirection="row" alignItems="center" justifyContent="flex-start">
          <CryptoCurrencyIconWrapper>
            {isLoadingCurrency ? (
              <Flex alignItems={"center"} justifyContent={"center"}>
                <InfiniteLoader />
              </Flex>
            ) : internalCurrency ? (
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
              <StarContainer data-testid="market-coin-star-button" onClick={toggleStar}>
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
                <Button data-testid="market-coin-buy-button" variant="color" mr={1} onClick={onBuy}>
                  {t("accounts.contextMenu.buy")}
                </Button>
              )}
              {availableOnSwap && (
                <Button
                  data-testid="market-coin-swap-button"
                  variant="color"
                  onClick={onSwap}
                  mr={1}
                >
                  {t("accounts.contextMenu.swap")}
                </Button>
              )}
              {availableOnStake && (
                <Button variant="color" onClick={onStake} data-testid="market-coin-stake-button">
                  {earnStakeLabelCoin}
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
      <MarketCoinChart
        price={price}
        priceChangePercentage={currentPriceChangePercentage}
        chartData={dataChart}
        range={range}
        counterCurrency={counterCurrency}
        refreshChart={changeRange}
        color={color}
        locale={locale}
        loading={isLoadingCurrency || isLoadingDataChart}
        setCounterCurrency={changeCounterCurrency}
        supportedCounterCurrencies={supportedCounterCurrencies}
      />
      <MarketInfo
        locale={locale}
        counterCurrency={counterCurrency}
        loading={isLoadingCurrency}
        range={range}
        {...currency}
      />
    </Container>
  );
}
