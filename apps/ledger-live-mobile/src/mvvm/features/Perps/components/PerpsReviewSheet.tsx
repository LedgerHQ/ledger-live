import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import type { PerpsReviewDetailItem } from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";
import { PerpsReviewSection } from "./PerpsReviewSection";

type PerpsReviewSheetSection = Readonly<{
  titleKey: string;
  details: readonly PerpsReviewDetailItem[];
}>;

type PerpsReviewSheetProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  titleKey: string;
  descriptionKey: string;
  sections: readonly PerpsReviewSheetSection[];
  ctaLabelKey: string;
  ctaTestID: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}>;

/** Review bottom sheet shared by the Perps deposit and withdraw flows. */
export function PerpsReviewSheet({
  isOpen,
  onClose,
  titleKey,
  descriptionKey,
  sections,
  ctaLabelKey,
  ctaTestID,
  onConfirm,
  confirmDisabled,
}: PerpsReviewSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader
          title={t(titleKey)}
          description={t(descriptionKey)}
          spacing
          density="expanded"
          lx={{ paddingHorizontal: "s0" }}
        />
        <Box lx={{ gap: "s24", paddingTop: "s16", paddingBottom: "s24" }}>
          {sections.map(section => (
            <PerpsReviewSection
              key={section.titleKey}
              titleKey={section.titleKey}
              details={section.details}
            />
          ))}

          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={onConfirm}
            disabled={confirmDisabled}
            testID={ctaTestID}
            icon={LedgerIcon}
          >
            {t(ctaLabelKey)}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
