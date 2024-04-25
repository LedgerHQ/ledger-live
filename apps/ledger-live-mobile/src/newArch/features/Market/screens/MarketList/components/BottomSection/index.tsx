import React from "react";
import {
  Text,
  ScrollContainerHeader,
  Icon,
  ScrollContainer,
  IconsLegacy,
} from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import SortBadge from "../SortBadge";
import { StyledBadge } from "../SortBadge/SortBadge.styled";
import { ScreenName } from "~/const";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import TrackScreen from "~/analytics/TrackScreen";
import useBottomSectionViewModel from "./useBottomSectionViewModel";
import { RANGES } from "~/newArch/features/Market/utils";

const SORT_OPTIONS = {
  top100: {
    requestParam: {
      starred: [],
      orderBy: "market_cap",
      order: "desc",
      search: "",
      liveCompatible: false,
      top100: true,
    },
    value: "top100",
  },
  market_cap_asc: {
    requestParam: {
      order: "asc",
      orderBy: "market_cap",
      top100: false,
      limit: 20,
    },
    value: "market_cap_asc",
  },
  market_cap_desc: {
    requestParam: {
      order: "desc",
      orderBy: "market_cap",
      top100: false,
      limit: 20,
    },
    value: "market_cap_desc",
  },
};

const getIcon = (top100?: boolean, order?: string) =>
  top100
    ? IconsLegacy.GraphGrowMedium
    : order === "asc"
      ? IconsLegacy.ArrowTopMedium
      : IconsLegacy.ArrowBottomMedium;

const TIME_RANGES = RANGES.map(value => ({
  requestParam: { range: value },
  value,
}));

interface ViewProps {
  top100?: boolean;
  orderBy?: string;
  order?: string;
  range?: string;
  counterCurrency?: string;
  onFilterChange: (_: MarketListRequestParams) => void;
  toggleFilterByStarredCurrencies: () => void;
  filterByStarredCurrencies: boolean;
}

function View({
  top100,
  orderBy,
  order,
  range,
  counterCurrency,
  onFilterChange,
  toggleFilterByStarredCurrencies,
  filterByStarredCurrencies,
}: ViewProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const timeRanges = TIME_RANGES.map(timeRange => ({
    ...timeRange,
    label: t(`market.range.${timeRange.value}`),
  }));
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
        label={t("market.filters.sort")}
        valueLabel={t(
          top100 ? `market.filters.order.topGainers` : `market.filters.order.${orderBy}`,
        )}
        Icon={getIcon(top100, order)}
        value={top100 ? "top100" : `${orderBy}_${order}`}
        options={[
          {
            ...SORT_OPTIONS.top100,
            label: t(`market.filters.order.topGainers`),
          },
          {
            ...SORT_OPTIONS.market_cap_asc,
            label: t(`market.filters.order.${orderBy}_asc`),
          },
          {
            ...SORT_OPTIONS.market_cap_desc,
            label: t(`market.filters.order.${orderBy}_desc`),
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
      />
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ScreenName.MarketCurrencySelect);
        }}
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
