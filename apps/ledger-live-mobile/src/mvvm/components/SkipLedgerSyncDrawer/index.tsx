import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import { SeedOriginType } from "@ledgerhq/types-live";

const CONTENT_BOTTOM_SPACING = 24;

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  openSync: () => void;
  skipSync: () => void;
  seedConfiguration?: React.RefObject<SeedOriginType | undefined>;
  /** False when the caller tracks this drawer's page itself. */
  trackScreen?: boolean;
};

function SkipLedgerSyncDrawer({
  isOpen,
  handleClose,
  openSync,
  skipSync,
  seedConfiguration,
  trackScreen = true,
}: Props) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID="sync-onboarding-drawer-skip"
    >
      <SkipLedgerSyncDrawerContent
        openSync={openSync}
        skipSync={skipSync}
        seedConfiguration={seedConfiguration}
        trackScreen={trackScreen}
      />
    </QueuedBottomSheet>
  );
}

function SkipLedgerSyncDrawerContent({
  openSync,
  skipSync,
  seedConfiguration,
  trackScreen,
}: Readonly<Omit<Props, "isOpen" | "handleClose">>) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}>
      <BottomSheetHeader />
      {trackScreen ? (
        <TrackScreen
          category="Drawer : Skip Ledger sync confirmation"
          flow="onboarding"
          seedConfiguration={seedConfiguration?.current}
        />
      ) : null}
      <Box
        lx={{
          width: "full",
          gap: "s24",
          paddingHorizontal: "s16",
          paddingTop: "s8",
          alignItems: "center",
        }}
      >
        <Spot appearance="muted" icon={InformationFill} size={72} />
        <Box lx={{ width: "full", gap: "s12", alignItems: "center" }}>
          <Text
            typography="heading4SemiBold"
            lx={{ color: "base", textAlign: "center", width: "full" }}
            testID="sync-onboarding-drawer-skip-title"
          >
            {t("syncOnboarding.syncStep.skip.title")}
          </Text>
          <Text
            typography="body2"
            lx={{ color: "muted", textAlign: "center", width: "full" }}
            testID="sync-onboarding-drawer-skip-description"
          >
            {t("syncOnboarding.syncStep.skip.description")}{" "}
            {t("syncOnboarding.syncStep.skip.descriptionEmphasis")}
          </Text>
        </Box>
        <Box lx={{ width: "full", gap: "s16" }}>
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={skipSync}
            testID="sync-onboarding-drawer-skipCTA"
          >
            {t("syncOnboarding.syncStep.skip.skipCTA")}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full" }}
            onPress={openSync}
            testID="sync-onboarding-drawer-syncCTA"
          >
            {t("syncOnboarding.syncStep.skip.syncCTA")}
          </Button>
        </Box>
      </Box>
    </BottomSheetView>
  );
}

export default SkipLedgerSyncDrawer;
