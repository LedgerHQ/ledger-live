import React, { memo } from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionCta } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";

interface QuickActionsCtasViewProps {
  readonly quickActions: readonly QuickActionCta[];
}

const QuickActionsCtasView = ({ quickActions }: QuickActionsCtasViewProps) => {
  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }} testID={QUICK_ACTIONS_TEST_IDS.ctas.container}>
      {quickActions.map(action => (
        <TileButton
          key={action.id}
          lx={{ flex: 1 }}
          icon={action.icon}
          onPress={action.onPress}
          disabled={action.disabled}
          testID={action.testID}
          accessibilityLabel={action.label}
          isFull
        >
          {action.label}
        </TileButton>
      ))}
    </Box>
  );
};

export default memo(QuickActionsCtasView);
