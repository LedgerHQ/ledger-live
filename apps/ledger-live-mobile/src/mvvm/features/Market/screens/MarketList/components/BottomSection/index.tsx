import React, { useMemo } from "react";
import { Text, ScrollContainerHeader, Icon, ScrollContainer, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { TouchableOpacity } from "react-native";
import SortBadge from "../SortBadge";
import { StyledBadge } from "../SortBadge/SortBadge.styled";
import { ScreenName } from "~/const";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";
import TrackScreen from "~/analytics/TrackScreen";
import useBottomSectionViewModel from "./useBottomSectionViewModel";
import { RANGES } from "LLM/features/Market/utils";
import { LIMIT } from "~/reducers/market";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";

const SORT_OPTIONS = {
  top100G: {
    requestParam: {
      starred: [],
      order: Order.topGainers,
      search: "",
      liveCompatible: false,
    },
    value: "top100_gainers",
  },
  top100L: {
    requestParam: {
      starred: [],
      order: Order.topLosers,
      search: "",
      liveCompatible: false,
    },
    value: "top100_losers",
  },
  market_cap_asc: {
    requestParam: {
      order: Order.MarketCapAsc,
      limit: LIMIT,
    },
    value: "market_cap_asc",
  },
  market_cap_desc: {
    requestParam: {
      order: Order.MarketCapDesc,
      limit: LIMIT,
    },
    value: "market_cap_desc",
  },
};

const getIcon = (order?: Order) => {
  switch (order) {
    case Order.topGainers:
      return <Icons.GraphAsc size="S" color="primary.c80" />;
    case Order.topLosers:
      return <Icons.GraphDesc size="S" color="primary.c80" />;
    case Order.MarketCapDesc:
      return <Icons.ArrowDown size="S" color="primary.c80" />;
    case Order.MarketCapAsc:
    default:
      return <Icons.ArrowUp size="S" color="primary.c80" />;
  }
};

const TIME_RANGES = RANGES.map(value => ({
  requestParam: { range: value },
  value,
}));

interface ViewProps {
  order?: Order;
  range?: string;
  counterCurrency?: string;
  onFilterChange: (_: MarketListRequestParams) => void;
  toggleFilterByStarredCurrencies: () => void;
  filterByStarredCurrencies: boolean;
}

function View({
  order,
  range,
  counterCurrency,
  onFilterChange,
  toggleFilterByStarredCurrencies,
  filterByStarredCurrencies,
}: ViewProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const top100G = order === Order.topGainers;
  const top100L = order === Order.topLosers;

  const top100 = top100G || top100L;

  const timeRanges = useMemo(
    () =>
      TIME_RANGES.map(timeRange => ({
        ...timeRange,
        label: t(`market.range.${rangeDataTable[timeRange.value].label}`),
      })).reverse(),
    [t],
  );
  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const overflowX = ScrollContainerHeader.Header.PADDING_HORIZONTAL;

  return (
    <ScrollContainer
      style={{ marginHorizontal: -overflowX, marginTop: 16 }}
      contentContainerStyle={{ paddingHorizontal: overflowX - 6 }}
      height={40}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <TrackScreen category="Page" name={"Market"} access={true} />
      <TouchableOpacity
        onPress={toggleFilterByStarredCurrencies}
        testID="toggle-starred-currencies"
      >
        <StyledBadge bg={filterByStarredCurrencies ? "primary.c80" : "neutral.c30"}>
          <Icon
            name={filterByStarredCurrencies ? "StarSolid" : "Star"}
            color={filterByStarredCurrencies ? "background.main" : "neutral.c100"}
          />
        </StyledBadge>
      </TouchableOpacity>
      <SortBadge
        testID="market-filter-sort"
        label={t("market.filters.sort")}
        valueLabel={t(
          top100
            ? `market.filters.order.${top100G ? "topGainers" : "topLosers"}`
            : "market.filters.order.marketCap",
        )}
        Icon={getIcon(order)}
        value={top100 ? `top100_${top100G ? "gainers" : "losers"}` : `market_cap_${order}`}
        options={[
          {
            ...SORT_OPTIONS.top100G,
            label: t("market.filters.order.topGainers"),
          },
          {
            ...SORT_OPTIONS.top100L,
            label: t("market.filters.order.topLosers"),
          },
          {
            ...SORT_OPTIONS.market_cap_asc,
            label: t("market.filters.order.asc"),
          },
          {
            ...SORT_OPTIONS.market_cap_desc,
            label: t("market.filters.order.desc"),
          },
        ]}
        onChange={onFilterChange}
      />
      <SortBadge
        label={t("market.filters.time")}
        value={timeRangeValue?.value}
        valueLabel={timeRangeValue?.label ?? ""}
        options={timeRanges}
        onChange={onFilterChange}
        testID="market-filter-time"
      />
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ScreenName.MarketCurrencySelect);
        }}
        testID="market-filter-currency"
      >
        <StyledBadge>
          <Text fontWeight="semiBold" variant="body">
            {t("market.filters.currency")}
          </Text>
          <Text ml={2} fontWeight="semiBold" variant="body" color="primary.c80" uppercase>
            {counterCurrency}
          </Text>
        </StyledBadge>
      </TouchableOpacity>
    </ScrollContainer>
  );
}

const BottomSection = () => <View {...useBottomSectionViewModel()} />;

export default BottomSection;
