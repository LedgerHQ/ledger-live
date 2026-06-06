import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { MARKET_SCREEN_TEST_IDS } from "../testIds";
import type { MarketFilterOption, MarketFilters } from "../useMarketFilters";

type MarketFiltersDrawerProps = Readonly<{
  filters: MarketFilters;
}>;

type MarketFilterSectionProps<TValue extends string> = Readonly<{
  title: string;
  items: MarketFilterOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  testID: string;
}>;

function MarketFilterSection<TValue extends string>({
  title,
  items,
  value,
  onValueChange,
  testID,
}: MarketFilterSectionProps<TValue>) {
  const { t } = useTranslation();
  const localizedItems = useMemo(
    () =>
      items.map(item => ({
        ...item,
        label: t(item.labelKey),
      })),
    [items, t],
  );

  return (
    <Box>
      <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
        {title}
      </Text>
      <Box testID={testID}>
        {localizedItems.map(item => {
          const selected = item.value === value;

          return (
            <ListItem
              key={item.value}
              density="compact"
              disabled={item.disabled}
              onPress={() => onValueChange(item.value)}
              style={{ marginHorizontal: -8 }}
              testID={`${testID}-${item.value}`}
            >
              <ListItemLeading>
                <ListItemContent>
                  <ListItemTitle>{item.label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              {selected ? (
                <ListItemTrailing>
                  <Check color="active" size={24} />
                </ListItemTrailing>
              ) : null}
            </ListItem>
          );
        })}
      </Box>
    </Box>
  );
}

export function MarketFiltersDrawer({ filters }: MarketFiltersDrawerProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      testID={MARKET_SCREEN_TEST_IDS.filtersDrawer}
      isRequestingToBeOpened={filters.isOpen}
      enableDynamicSizing
      onClose={filters.onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ gap: "s24", paddingHorizontal: "s16", paddingTop: "s12" }}>
          <MarketFilterSection
            title={t("market.assets.filters.sorting")}
            items={filters.sortingOptions}
            value={filters.sorting}
            onValueChange={filters.onSelectSorting}
            testID={MARKET_SCREEN_TEST_IDS.filtersSortingList}
          />
          <MarketFilterSection
            title={t("market.assets.filters.timeframe")}
            items={filters.timeframeOptions}
            value={filters.timeframe}
            onValueChange={filters.onSelectTimeframe}
            testID={MARKET_SCREEN_TEST_IDS.filtersTimeframeList}
          />
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
