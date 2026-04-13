import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionRowItem } from "./useQuickActionsRowViewModel";

interface QuickActionsRowViewProps {
  readonly actions: readonly QuickActionRowItem[];
}

export function QuickActionsRowView({ actions }: QuickActionsRowViewProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }} testID="my-wallet-quick-actions-row">
      {actions.map(action => (
        <TileButton
          key={action.id}
          lx={{ flex: 1 }}
          icon={action.icon}
          onPress={action.onPress}
          isFull
          testID={action.testID}
          accessibilityLabel={action.label}
        >
          {action.label}
        </TileButton>
      ))}
    </Box>
  );
}
