import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { AccountAnalyticsLabels } from "../../AccountAnalytics.types";

type AnalyticsStatusContentProps = Readonly<{
  isError: boolean;
  labels: Pick<AccountAnalyticsLabels, "error" | "unavailable" | "retry">;
  onRetry: () => void;
}>;

export function AnalyticsStatusContent({ isError, labels, onRetry }: AnalyticsStatusContentProps) {
  return (
    <Box
      lx={{ flexDirection: "column", alignItems: "flex-start", gap: "s12", paddingVertical: "s24" }}
    >
      <Text
        typography="body2"
        lx={{ color: "muted" }}
        accessibilityRole={isError ? "alert" : "text"}
        accessibilityLiveRegion="polite"
      >
        {isError ? labels.error : labels.unavailable}
      </Text>
      {isError && (
        <Button appearance="gray" size="sm" onPress={onRetry}>
          {labels.retry}
        </Button>
      )}
    </Box>
  );
}
