import React, { type ReactNode } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import type { StatusMessageState } from "../types";

const SPOT_TEXT_OVERLAP = -56;

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  state: StatusMessageState;
  testId: string;
  action?: Readonly<{ testId: string; onClick: () => void }>;
  hasDisclaimer?: boolean;
  overlapSpot?: boolean;
}>;

export function StatusMessage({
  spot,
  state,
  testId,
  action,
  hasDisclaimer = false,
  overlapSpot = false,
}: StatusMessageProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        flex: 1,
        alignItems: "center",
        justifyContent: overlapSpot ? "flex-start" : "center",
        gap: "s24",
        paddingTop: overlapSpot ? "s32" : undefined,
      }}
      testID={testId}
    >
      {spot}
      <Box
        lx={{ alignItems: "center", gap: "s4" }}
        style={overlapSpot ? { marginTop: SPOT_TEXT_OVERLAP } : undefined}
      >
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t(`payTab.cardTransactions.history.${state}.title`)}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t(`payTab.cardTransactions.history.${state}.description`)}
        </Text>
      </Box>
      {action ? (
        <Button appearance="base" onPress={action.onClick} testID={action.testId}>
          {t("payTab.cardTransactions.history.goToPay")}
        </Button>
      ) : null}
      {hasDisclaimer ? (
        <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
          {t("payTab.disclaimer")}
        </Text>
      ) : null}
    </Box>
  );
}
