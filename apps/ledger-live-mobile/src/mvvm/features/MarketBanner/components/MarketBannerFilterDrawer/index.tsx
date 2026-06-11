import React, { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  OptionList,
  OptionListContent,
  OptionListItem,
  OptionListItemContent,
  OptionListItemDescription,
  OptionListItemText,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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
    <QueuedDrawerBottomSheet
      testID={MARKET_BANNER_TEST_IDS.filterDrawer}
      isRequestingToBeOpened={controller.isOpen}
      enableDynamicSizing
      onClose={controller.onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader title={t("marketBanner.filter.title")} />
        <OptionList
          items={items}
          value={controller.filter}
          onValueChange={value => {
            if (value) controller.onSelect(value as MarketBannerRanking);
          }}
        >
          <OptionListContent
            lx={{ marginBottom: "s24" }}
            renderItem={item => (
              <OptionListItem
                value={item.value}
                disabled={item.disabled}
                testID={`${MARKET_BANNER_TEST_IDS.filterDrawer}-${item.value}`}
              >
                <OptionListItemContent>
                  <OptionListItemText>{item.label}</OptionListItemText>
                  {item.description ? (
                    <OptionListItemDescription>{item.description}</OptionListItemDescription>
                  ) : null}
                </OptionListItemContent>
              </OptionListItem>
            )}
          />
        </OptionList>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
