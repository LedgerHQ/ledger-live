import React, { type ReactNode } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";

const SPOT_TEXT_OVERLAP = -56;

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  titleKey: string;
  descriptionKey: string;
  testId: string;
  action?: Readonly<{ labelKey: string; testId: string; onClick: () => void }>;
  disclaimerKey?: string;
  overlapSpot?: boolean;
}>;

export function StatusMessage({
  spot,
  titleKey,
  descriptionKey,
  testId,
  action,
  disclaimerKey,
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
          {t(titleKey)}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t(descriptionKey)}
        </Text>
      </Box>
      {action ? (
        <Button appearance="base" onPress={action.onClick} testID={action.testId}>
          {t(action.labelKey)}
        </Button>
      ) : null}
      {disclaimerKey ? (
        <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
          {t(disclaimerKey)}
        </Text>
      ) : null}
    </Box>
  );
}
