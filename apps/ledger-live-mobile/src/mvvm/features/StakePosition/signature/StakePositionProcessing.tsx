import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import { useTranslation } from "~/context/Locale";

const TITLE_KEYS = {
  deactivate: "stakePosition.signature.processingTitle.deactivate",
  withdraw: "stakePosition.signature.processingTitle.withdraw",
} as const satisfies Record<StakePositionExitAction, string>;

type StakePositionProcessingProps = Readonly<{
  action: StakePositionExitAction;
  testID?: string;
}>;

/** The device or the network works on the exit transaction. */
export function StakePositionProcessing({ action, testID }: StakePositionProcessingProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s16", paddingVertical: "s24" }} testID={testID}>
      <Spinner size={40} />
      <Box lx={{ alignItems: "center", gap: "s4" }}>
        <Text
          accessibilityRole="header"
          typography="heading4SemiBold"
          lx={{ color: "base", textAlign: "center" }}
        >
          {t(TITLE_KEYS[action])}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t("stakePosition.signature.processing")}
        </Text>
      </Box>
    </Box>
  );
}
