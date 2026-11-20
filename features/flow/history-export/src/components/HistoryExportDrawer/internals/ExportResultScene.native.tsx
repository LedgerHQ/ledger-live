import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";

const VARIANTS = {
  success: {
    titleKey: "history.exportDialog.successTitle",
    descriptionKey: "history.exportDialog.successDescription",
    buttonKey: "history.exportDialog.done",
  },
  error: {
    titleKey: "history.exportDialog.errorTitle",
    descriptionKey: "history.exportDialog.errorDescription",
    buttonKey: "history.exportDialog.tryAgain",
  },
} as const;

type Props = Readonly<{
  variant: keyof typeof VARIANTS;
  onButtonClick: () => void;
}>;

export function ExportResultScene({ variant, onButtonClick }: Props) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();
  const config = VARIANTS[variant];

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      <BottomSheetHeader />
      <Box lx={{ paddingHorizontal: "s16" }} testID={`history-export-${variant}`}>
        <InfoState
          preset={variant}
          size="hug"
          title={t(config.titleKey)}
          description={t(config.descriptionKey)}
          primaryCta={{
            label: t(config.buttonKey),
            onPress: onButtonClick,
            testID: `history-export-${variant}-cta`,
          }}
        />
      </Box>
    </BottomSheetView>
  );
}
