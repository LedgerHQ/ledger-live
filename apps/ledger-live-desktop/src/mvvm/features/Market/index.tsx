import React, { useEffect } from "react";
import { Flex, Dropdown } from "@ledgerhq/react-ui";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import styled from "styled-components";
import { useMarket } from "LLD/features/Market/hooks/useMarket";
import TrackPage from "~/renderer/analytics/TrackPage";
import SearchInputComponent from "./components/SearchInputComponent";
import SideDrawerFilter from "~/renderer/screens/market/components/SideDrawerFilter";
import CounterValueSelect from "~/renderer/screens/market/components/CountervalueSelect";
import PageHeader from "LLD/components/PageHeader";
import { useNavigate } from "react-router";
import MarketListLegacy from "./components/MarketListLegacy";
import MarketTable from "./components/MarketTable";
import MarketTopCards from "./TopCards";
import { MarketCategoryBar } from "./components/MarketCategoryBar";
import { MarketRangeSelect } from "./components/MarketRangeSelect";

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
    timeRangeSelectOptions,
    refreshRate,
    marketCurrentPage,
    categories,
    shouldDisplayAssetDiscoverability,
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

  return (
    <Container>
      <TrackPage
        category="Market"
        sort={order !== "desc"}
        timeframe={range}
        countervalue={counterCurrency}
      />
      <PageHeader title={t("market.title")} onBack={() => navigate("/")} />

      <Flex flexDirection="row" pr="6px" my={2} alignItems="center" justifyContent="space-between">
        {!shouldDisplayAssetDiscoverability && (
          <SearchInputComponent search={search} updateSearch={updateSearch} />
        )}
        <SelectBarContainer
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-end"
          ml="auto"
        >
          {!shouldDisplayAssetDiscoverability && (
            <Flex data-testid="market-countervalue-select" justifyContent="flex-end" mx={4}>
              <CounterValueSelect
                counterCurrency={String(counterCurrency)}
                setCounterCurrency={setCounterCurrency}
                supportedCounterCurrencies={supportedCounterCurrencies}
              />
            </Flex>
          )}
          {!shouldDisplayAssetDiscoverability && (
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
                    cursor: "pointer",
                  }),
                }}
              />
            </Flex>
          )}
          {!shouldDisplayAssetDiscoverability && (
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
          )}
        </SelectBarContainer>
      </Flex>
      <MarketTopCards />
      {shouldDisplayAssetDiscoverability && (
        <div className="flex flex-col gap-12 mb-16">
          <Subheader>
            <SubheaderRow>
              <SubheaderTitle>{t("market.assetsTitle")}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          <div className="flex items-center justify-between">
            <MarketCategoryBar categories={categories} t={t} />
            <MarketRangeSelect
              options={timeRangeSelectOptions}
              value={timeRangeValue}
              onChange={updateTimeRange}
            />
          </div>
        </div>
      )}
      {shouldDisplayAssetDiscoverability ? (
        <MarketTable {...marketData} />
      ) : (
        <MarketListLegacy {...marketData} />
      )}
    </Container>
  );
}
