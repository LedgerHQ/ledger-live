import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state";
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
  const { bottom } = useSafeAreaInsets();
  const config = VARIANTS[variant];

  return (
    <BottomSheetView style={{ paddingBottom: bottom + 24 }}>
      {variant === "success" ? (
        <TrackScreen
          category={HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME}
          name={HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE.name}
          refreshSource={false}
        />
      ) : null}
      <BottomSheetHeader />
      <Box lx={{ paddingHorizontal: "s16" }} testID={`history-export-${variant}-title`}>
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
