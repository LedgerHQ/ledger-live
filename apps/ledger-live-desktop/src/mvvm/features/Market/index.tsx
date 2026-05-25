import React, { useEffect, useState } from "react";
import { Flex, Dropdown } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useMarket } from "LLD/features/Market/hooks/useMarket";
import TrackPage from "~/renderer/analytics/TrackPage";
import SearchInputComponent from "./components/SearchInputComponent";
import SideDrawerFilter from "~/renderer/screens/market/components/SideDrawerFilter";
import CounterValueSelect from "~/renderer/screens/market/components/CountervalueSelect";
import { useMarketListVirtualization } from "LLD/features/Market/hooks/useMarketListVirtualization";
import PageHeader from "LLD/components/PageHeader";
import { useNavigate } from "react-router";
import MarketList from "./screens/MarketList";
import {
  marketParamsSelector,
  marketCurrentPageSelector,
  marketStoreSelector,
} from "~/renderer/reducers/market";
import { setMarketParams } from "~/renderer/actions/market";

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflow: "hidden",
  px: 1,
})``;

const SelectBarContainer = styled(Flex)`
  font-size: 13px;
`;

export default function Market() {
  const marketData = useMarket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxMarketParams = useSelector(marketParamsSelector);
  const reduxCurrentPage = useSelector(marketCurrentPageSelector);
  const reduxMarketStore = useSelector(marketStoreSelector);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (!hasMounted && reduxMarketStore) {
      dispatch(
        setMarketParams({
          ...reduxMarketParams,
          page: reduxCurrentPage ?? 1,
        }),
      );
      setHasMounted(true);
    }
  }, [hasMounted, reduxMarketStore, reduxMarketParams, reduxCurrentPage, dispatch]);

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
  } = marketData;

  /**
   * Reset the page to 1 when the component mounts to only refetch first page
   * */
  useEffect(() => {
    resetMarketPage(marketParams.page ?? 1);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Try to Refetch data every REFRESH_RATE time
   */
  useEffect(() => {
    const intervalId = setInterval(() => refetchData(marketCurrentPage ?? 1), refreshRate);
    return () => clearInterval(intervalId);
  }, [marketCurrentPage, refetchData, refreshRate]);

  const { order, range, counterCurrency, search = "", liveCompatible } = marketParams;

  const virtualization = useMarketListVirtualization({
    itemCount: marketData.itemCount,
    marketData: marketData.marketData,
    loading: marketData.loading,
    currenciesLength: marketData.currenciesLength,
    onLoadNextPage: marketData.onLoadNextPage,
    checkIfDataIsStaleAndRefetch: marketData.checkIfDataIsStaleAndRefetch,
  });

  const headerTitle = reduxMarketParams?.search
    ? `${t("market.title")} — "${reduxMarketParams.search}"`
    : t("market.title");

  return (
    <Container>
      <TrackPage
        category="Market"
        sort={order !== "desc"}
        timeframe={range}
        countervalue={counterCurrency}
      />
      <PageHeader title={headerTitle} onBack={() => navigate("/")} />

      <Flex flexDirection="row" pr="6px" my={2} alignItems="center" justifyContent="space-between">
        <SearchInputComponent search={search} updateSearch={updateSearch} />
        <SelectBarContainer flexDirection="row" alignItems="center" justifyContent="flex-end">
          <Flex data-testid="market-countervalue-select" justifyContent="flex-end" mx={4}>
            <CounterValueSelect
              counterCurrency={String(counterCurrency)}
              setCounterCurrency={setCounterCurrency}
              supportedCounterCurrencies={supportedCounterCurrencies}
            />
          </Flex>
          <Flex data-testid="market-range-select" mx={2}>
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
      <MarketList {...marketData} virtualization={virtualization} />
    </Container>
  );
}
