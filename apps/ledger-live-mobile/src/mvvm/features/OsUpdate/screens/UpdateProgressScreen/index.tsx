import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
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
  return (
    <Box lx={{ ...screenStyle, gap: "s40" }} testID="os-update-progress-screen">
      <ProgressBar
        progress={progress}
        initialProgress={initialProgress}
        animationMs={progressAnimationMs}
        onAnimationEnd={onProgressAnimationEnd}
        testID="os-update-progress-bar"
      />
      <Box lx={{ alignItems: "center", gap: "s16" }}>
        {isRestoring ? (
          <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
            <Trans i18nKey="osUpdates.progress.restoringTitle" />
          </Text>
        ) : null}
        {!isRestoring && update && update.count >= MIN_UPDATE_COUNT_TO_SHOW_INDEX ? (
          <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
            <Trans
              i18nKey="osUpdates.progress.updatingTitle"
              values={{ index: update.index, count: update.count }}
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
  );
}
