import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import { PerpsReviewSection } from "LLM/features/Perps/components/PerpsReviewSection";
import type { PerpsWithdrawSummaryViewModel } from "./usePerpsWithdrawSummaryViewModel";

export function PerpsWithdrawSummaryView({
  drawerOpen,
  swapDetails,
  withdrawDetails,
  canWithdraw,
  handleDrawerClose,
  handleWithdraw,
}: Readonly<PerpsWithdrawSummaryViewModel>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={drawerOpen}
      onClose={handleDrawerClose}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader
          title={t("perpsReview.withdrawTitle")}
          description={t("perpsReview.withdrawSubtitle")}
          spacing
          density="expanded"
          lx={{ paddingHorizontal: "s0" }}
        />
        <Box lx={{ gap: "s24", paddingTop: "s16", paddingBottom: "s24" }}>
          <PerpsReviewSection titleKey="perpsReview.swapDetailTitle" details={swapDetails} />
          <PerpsReviewSection
            titleKey="perpsReview.withdrawDetailTitle"
            details={withdrawDetails}
          />

          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={handleWithdraw}
            disabled={!canWithdraw}
            testID="perps-withdraw-cta"
            icon={LedgerIcon}
          >
            {t("perpsReview.withdrawCTA")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
