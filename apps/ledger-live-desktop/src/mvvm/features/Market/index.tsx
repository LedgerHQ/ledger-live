import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import styled from "styled-components";
import { useMarket } from "LLD/features/Market/hooks/useMarket";
import PageHeader from "LLD/components/PageHeader";
import { useNavigate } from "react-router";
import MarketTable from "./components/MarketTable";
import MarketTopCards from "./TopCards";
import { MarketCategoryBar } from "./components/MarketCategoryBar";
import { MarketRangeSelect } from "./components/MarketRangeSelect";
import { useTrackMarketDiscoverabilityPage } from "./utils/marketPageAnalytics";

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflow: "hidden",
  px: 1,
})``;

export default function Market() {
  const marketData = useMarket();
  const navigate = useNavigate();
  const {
    resetMarketPage,
    updateTimeRange,
    marketParams,
    timeRangeValue,
    timeRangeSelectOptions,
    categories,
    t,
  } = marketData;

  /**
   * Reset the page to 1 when the component mounts to only refetch first page
   * */
  useEffect(() => {
    resetMarketPage();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { order, range } = marketParams;

  useTrackMarketDiscoverabilityPage({
    order,
    range,
    category: categories.selectedCategory,
  });

  return (
    <Container>
      <PageHeader title={t("market.title")} onBack={() => navigate("/")} />
      <MarketTopCards />
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
      <MarketTable {...marketData} />
    </Container>
  );
}
