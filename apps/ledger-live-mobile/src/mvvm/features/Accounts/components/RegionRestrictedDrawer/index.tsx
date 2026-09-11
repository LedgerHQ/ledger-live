import React, { useCallback } from "react";
import { Linking } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

type Props = {
  isOpen: boolean;
  currency: CryptoOrTokenCurrency;
  onClose: () => void;
};

const DRAWER_NAME = "RegionRestricted";

export function RegionRestrictedDrawer({ isOpen, currency, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader />
        <InfoState
          preset="spot"
          spotProps={{ icon: Globe }}
          size="hug"
          title={t("errors.CurrencyRegionRestrictedError.title", { currencyName: currency.name })}
          description={t("errors.CurrencyRegionRestrictedError.description", {
            currencyName: currency.name,
          })}
          // Through `content` rather than the CTA props: those render buttons that cannot carry the
          // external-link icon the design asks for.
          content={
            <Box lx={{ gap: "s16", width: "full" }}>
              <Button
                appearance="base"
                size="lg"
                lx={{ width: "full" }}
                icon={ExternalLink}
                onPress={onLearnMore}
                testID="region-restricted-learn-more"
              >
                {t("common.learnMore")}
              </Button>
              <Button
                appearance="gray"
                size="lg"
                lx={{ width: "full" }}
                onPress={onPressClose}
                testID="region-restricted-close"
              >
                {t("common.close")}
              </Button>
            </Box>
          }
          testID="region-restricted-drawer"
        />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
