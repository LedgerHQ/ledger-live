import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { BalanceEmptyLabels } from "../../types";

type BalanceEmptyStateProps = Readonly<{
  labels: BalanceEmptyLabels;
}>;

export function BalanceEmptyState({ labels }: BalanceEmptyStateProps) {
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", gap: "s16", paddingVertical: "s32" }}
      testID="pay-card-balance-empty-state"
    >
      <Text typography="heading1SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {labels.emptyTitle}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {labels.emptyDescription}
      </Text>
    </Box>
  );
}
