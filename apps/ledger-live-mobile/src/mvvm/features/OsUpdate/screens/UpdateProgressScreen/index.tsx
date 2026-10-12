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
    <Box lx={screenStyle} testID="os-update-progress-screen">
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {isRestoring ? (
          <Trans i18nKey="osUpdates.progress.restoringTitle" />
        ) : (
          <Trans i18nKey="osUpdates.progress.updatingTitle" values={{ productName }} />
        )}
      </Text>
      {update && update.count >= MIN_UPDATE_COUNT_TO_SHOW_INDEX ? (
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          <Trans
            i18nKey="osUpdates.progress.updateCount"
            values={{ index: update.index, count: update.count }}
          />
        </Text>
      ) : null}
      <ProgressBar
        progress={progress}
        initialProgress={initialProgress}
        animationMs={progressAnimationMs}
        onAnimationEnd={onProgressAnimationEnd}
        testID="os-update-progress-bar"
      />
      <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
        <Trans i18nKey="osUpdates.progress.description" />
      </Text>
    </Box>
  );
}
