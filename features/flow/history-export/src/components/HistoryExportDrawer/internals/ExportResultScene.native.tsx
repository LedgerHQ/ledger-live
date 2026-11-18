import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import {
  HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE,
  HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
} from "../../../constants";

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
      {variant === "success" ? (
        <TrackScreen
          category={HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME}
          name={HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE.name}
          refreshSource={false}
        />
      ) : null}
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
