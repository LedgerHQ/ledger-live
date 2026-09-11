import React, { useCallback } from "react";
import { Linking } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
type Props = {
  isOpen: boolean;
  currencyName: string;
  onClose: () => void;
};

const DRAWER_NAME = "RegionRestricted";

// Rendered inside the sheet so the tone request reaches its context: the `spot` preset carries none
// of its own, unlike the status presets.
function Content({ currencyName }: { currencyName: string }) {
  const { t } = useTranslation();
  useBottomSheetBackgroundTone("info");

  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: Globe }}
      size="hug"
      title={t("errors.CurrencyRegionRestrictedError.title", { currencyName })}
      description={t("errors.CurrencyRegionRestrictedError.description", { currencyName })}
      testID="region-restricted-drawer"
    />
  );
}

export function RegionRestrictedDrawer({ isOpen, currencyName, onClose }: Props) {
  const { t } = useTranslation();

  const onLearnMore = useCallback(() => {
    track("button_clicked", { button: "Learn more", drawer: DRAWER_NAME });
    Linking.openURL(urls.geoBlock.learnMore);
  }, []);

  const onPressClose = useCallback(() => {
    track("button_clicked", { button: "Close", drawer: DRAWER_NAME });
    onClose();
  }, [onClose]);

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onPressClose} enableDynamicSizing>
      <BottomSheetView>
        <BottomSheetHeader />
        <Content currencyName={currencyName} />
        <Box lx={{ gap: "s16", paddingHorizontal: "s16", paddingBottom: "s24", width: "full" }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            icon={ExternalLink}
            onPress={onLearnMore}
            testID="region-restricted-learn-more"
          >
            {t("common.learnMore")}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            isFull
            onPress={onPressClose}
            testID="region-restricted-close"
          >
            {t("common.close")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
