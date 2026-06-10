import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { MARKET_BANNER_TEST_IDS } from "../../constants";
import type { MarketBannerFilterController } from "../../hooks/useMarketBannerFilter";

type MarketBannerFilterDrawerProps = Readonly<{
  controller: MarketBannerFilterController;
}>;

// Scaffold: the interactive option list (selection, disabled "Favorites", tracking) is added in the drawer task.
export function MarketBannerFilterDrawer({ controller }: MarketBannerFilterDrawerProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      testID={MARKET_BANNER_TEST_IDS.filterDrawer}
      isRequestingToBeOpened={controller.isOpen}
      enableDynamicSizing
      onClose={controller.onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s12" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            {t("marketBanner.filter.title")}
          </Text>
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
