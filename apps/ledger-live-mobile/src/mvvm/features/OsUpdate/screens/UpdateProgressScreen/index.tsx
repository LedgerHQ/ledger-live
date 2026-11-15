import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans, useTranslation } from "~/context/Locale";
import { ProgressBar } from "./ProgressBar";
import { screenStyle } from "../screenStyle";

const MIN_UPDATE_COUNT_TO_SHOW_INDEX = 2;

type UpdateProgressScreenProps = Readonly<{
  productName: string;
  progress: number;
  isRestoring: boolean;
  update?: Readonly<{ index: number; count: number }>;
  initialProgress?: number;
  progressAnimationMs?: number;
  onProgressAnimationEnd?: () => void;
}>;

export function UpdateProgressScreen({
  productName,
  progress,
  isRestoring,
  update,
  initialProgress,
  progressAnimationMs,
  onProgressAnimationEnd,
}: UpdateProgressScreenProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const updateCount =
    !isRestoring && update && update.count >= MIN_UPDATE_COUNT_TO_SHOW_INDEX
      ? update.count
      : undefined;

  return (
    <Box lx={{ flex: 1 }} testID="os-update-progress-screen">
      <Box lx={{ ...screenStyle, gap: "s40" }}>
        <ProgressBar
          progress={progress}
          initialProgress={initialProgress}
          animationMs={progressAnimationMs}
          onAnimationEnd={onProgressAnimationEnd}
          testID="os-update-progress-bar"
        />
        <Box lx={{ alignItems: "center", gap: "s8" }}>
          {isRestoring ? (
            <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
              <Trans i18nKey="osUpdates.progress.restoringTitle" />
            </Text>
          ) : null}
          {update && updateCount ? (
            <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
              <Trans
                i18nKey="osUpdates.progress.updatingTitle"
                values={{ index: update.index, count: updateCount }}
              />
            </Text>
          ) : null}
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            <Trans
              i18nKey={
                isRestoring
                  ? "osUpdates.progress.restoringDescription"
                  : "osUpdates.progress.updatingDescription"
              }
              values={{ productName }}
            />
          </Text>
        </Box>
      </Box>
      {updateCount ? (
        <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottomInset + 24 }}>
          <Banner
            appearance="info"
            title={t("osUpdates.progress.whyUpdatesTitle", { count: updateCount })}
            description={t("osUpdates.progress.whyUpdatesDescription")}
            testID="os-update-why-updates-banner"
          />
        </Box>
      ) : null}
      {isRestoring ? (
        <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottomInset + 24 }}>
          <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
            <Trans i18nKey="osUpdates.progress.stayOnScreen" />
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
