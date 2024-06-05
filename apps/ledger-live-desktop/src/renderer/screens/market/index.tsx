import React, { useEffect } from "react";
import { Flex, Button as BaseButton, Text, Dropdown } from "@ledgerhq/react-ui";
import styled from "styled-components";
import CounterValueSelect from "./components/CountervalueSelect";
import SideDrawerFilter from "./components/SideDrawerFilter";
import TrackPage from "~/renderer/analytics/TrackPage";
import MarketList from "./MarketList";
import { useMarket } from "./hooks/useMarket";
import SearchInputComponent from "./components/SearchInputComponent";

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflow: "hidden",
  px: 1,
  mx: -1,
})``;

export const Button = styled(BaseButton)<{ big?: boolean }>`
  ${p =>
    p.Icon
      ? `
      height: 40px;
      width: 40px;
      `
      : `
          font-size:  ${p.big ? 14 : 12}px;
          height: ${p.big ? 48 : 32}px;
          line-height: ${p.big ? 48 : 32}px;
          padding: 0 ${p.big ? 25 : 15}px;
      `}

  ${p =>
    p.variant === "shade"
      ? `background-color: transparent!important;border-color: currentColor;`
      : ``}
`;

const Title = styled(Text).attrs({ variant: "h3" })`
  font-size: 28px;
  line-height: 33px;
`;

const SelectBarContainer = styled(Flex)`
  font-size: 13px;
`;

export default function Market() {
  const {
    refresh,
    setCounterCurrency,
    updateSearch,
    updateTimeRange,
    toggleFilterByStarredAccounts,
    toggleLiveCompatible,
    resetMarketPage,
    refetchData,
    marketParams,
    supportedCounterCurrencies,
    timeRangeValue,
    starFilterOn,
    starredMarketCoins,
    timeRanges,
    refreshRate,
    marketCurrentPage,
    t,
  } = useMarket();

  /**
   * Reset the page to 1 when the component mounts to only refetch first page
   * */
  useEffect(() => {
    resetMarketPage(marketParams.page ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Try to Refetch data every REFRESH_RATE time
   */
  useEffect(() => {
    const intervalId = setInterval(() => refetchData(marketCurrentPage ?? 1), refreshRate);

    return () => clearInterval(intervalId as unknown as number);
  }, [marketCurrentPage, refetchData, refreshRate]);

  const { order, range, counterCurrency, search = "", liveCompatible } = marketParams;

  return (
    <Container>
      <TrackPage
        category="Market"
        sort={order !== "desc"}
        timeframe={range}
        countervalue={counterCurrency}
      />
      <Title>{t("market.title")}</Title>
      <Flex flexDirection="row" pr="6px" my={2} alignItems="center" justifyContent="space-between">
        <SearchInputComponent search={search} updateSearch={updateSearch} />
        <SelectBarContainer flexDirection="row" alignItems="center" justifyContent="flex-end">
          <Flex data-test-id="market-countervalue-select" justifyContent="flex-end" mx={4}>
            <CounterValueSelect
              counterCurrency={String(counterCurrency)}
              setCounterCurrency={setCounterCurrency}
              supportedCounterCurrencies={supportedCounterCurrencies}
            />
          </Flex>
          <Flex data-test-id="market-range-select" mx={2}>
            <Dropdown
              label={t("common.range")}
              menuPortalTarget={document.body}
              onChange={updateTimeRange}
              options={timeRanges}
              value={timeRangeValue}
              styles={{
                control: () => ({
                  display: "flex",
                  padding: 0,
                }),
              }}
            />
          </Flex>
          <Flex ml={4} mr={3}>
            <SideDrawerFilter
              refresh={refresh}
              filters={{
                starred: {
                  toggle: toggleFilterByStarredAccounts,
                  value: starFilterOn,
                  disabled: !starredMarketCoins?.length,
                },
                liveCompatible: {
                  toggle: toggleLiveCompatible,
                  value: Boolean(liveCompatible),
                },
              }}
              t={t}
            />
          </Flex>
        </SelectBarContainer>
      </Flex>
      <MarketList {...useMarket()} />
    </Container>
  );
}
