import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import { PerpsReviewDetailRow } from "./components/PerpsReviewDetailRow";
import type { PerpsReviewDetailItem, PerpsReviewViewModel } from "./usePerpsReviewViewModel";

type PerpsReviewSectionProps = Readonly<{
  titleKey: string;
  details: readonly PerpsReviewDetailItem[];
}>;

function PerpsReviewSection({ titleKey, details }: PerpsReviewSectionProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ gap: "s12" }}>
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s4" }}>
          <SubheaderTitle>{t(titleKey)}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ gap: "s8" }}>
        {details.map(detail => (
          <PerpsReviewDetailRow
            key={detail.labelKey}
            label={t(detail.labelKey)}
            value={detail.value}
            testID={detail.testID}
          />
        ))}
      </Box>
    </Box>
  );
}

export function PerpsReviewView({
  drawerOpen,
  swapDetails,
  depositDetails,
  handleDrawerClose,
  handleDeposit,
}: Readonly<PerpsReviewViewModel>) {
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
          title={t("perpsReview.depositTitle")}
          description={t("perpsReview.depositSubtitle")}
          spacing
          density="expanded"
          lx={{ paddingHorizontal: "s0" }}
        />
        <Box lx={{ gap: "s24", paddingTop: "s16", paddingBottom: "s24" }}>
          <PerpsReviewSection titleKey="perpsReview.swapDetailTitle" details={swapDetails} />
          <PerpsReviewSection titleKey="perpsReview.depositDetailTitle" details={depositDetails} />

          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={handleDeposit}
            testID="perps-deposit-cta"
            icon={LedgerIcon}
          >
            {t("perpsReview.depositCTA")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
