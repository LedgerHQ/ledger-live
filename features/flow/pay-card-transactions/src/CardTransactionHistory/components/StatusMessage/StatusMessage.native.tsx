import React, { type ReactNode } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  titleKey: string;
  descriptionKey: string;
  testId: string;
  action?: Readonly<{ labelKey: string; testId: string; onClick: () => void }>;
}>;

export function StatusMessage({
  spot,
  titleKey,
  descriptionKey,
  testId,
  action,
}: StatusMessageProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24" }}
      testID={testId}
    >
      {spot}
      <Box lx={{ alignItems: "center", gap: "s4" }}>
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
    </Box>
  );
}
