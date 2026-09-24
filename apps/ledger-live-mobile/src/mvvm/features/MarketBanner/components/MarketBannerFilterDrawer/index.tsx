import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  SelectList,
  SelectListContent,
  SelectListItem,
  SelectListItemContent,
  SelectListItemDescription,
  SelectListItemText,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { MarketBannerRanking } from "~/reducers/types";
import { MARKET_BANNER_TEST_IDS } from "../../constants";
import type { MarketBannerFilterController } from "../../hooks/useMarketBannerFilter";

type MarketBannerFilterDrawerProps = Readonly<{
  controller: MarketBannerFilterController;
}>;

export function MarketBannerFilterDrawer({ controller }: MarketBannerFilterDrawerProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const items = useMemo(
    () =>
      controller.options.map(option => ({
        value: option.value,
        label: t(option.labelKey),
        disabled: option.disabled,
        description: option.descriptionKey ? t(option.descriptionKey) : undefined,
      })),
    [controller.options, t],
  );

  return (
    <QueuedBottomSheet
      testID={MARKET_BANNER_TEST_IDS.filterDrawer}
      isRequestingToBeOpened={controller.isOpen}
      enableDynamicSizing
      onClose={controller.onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader title={t("marketBanner.filter.title")} />
        <SelectList
          items={items}
          value={controller.filter}
          onValueChange={value => {
            if (value) controller.onSelect(value as MarketBannerRanking);
          }}
        >
          <SelectListContent
            lx={{ marginBottom: "s24" }}
            renderItem={item => (
              <SelectListItem
                value={item.value}
                disabled={item.disabled}
                testID={`${MARKET_BANNER_TEST_IDS.filterDrawer}-${item.value}`}
              >
                <SelectListItemContent>
                  <SelectListItemText>{item.label}</SelectListItemText>
                  {item.description ? (
                    <SelectListItemDescription>{item.description}</SelectListItemDescription>
                  ) : null}
                </SelectListItemContent>
              </SelectListItem>
            )}
          />
        </SelectList>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
