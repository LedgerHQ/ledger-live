import React, { memo } from "react";
import { Box, Text, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionCta } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";

interface QuickActionsCtasViewProps {
  readonly quickActions: readonly QuickActionCta[];
  readonly isVariant?: boolean;
}

const QuickActionsCtasView = ({ quickActions, isVariant = false }: QuickActionsCtasViewProps) => {
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
          {isVariant ? (
            <Text
              typography="body3SemiBold"
              lx={{
                textAlign: "center",
                color: action.disabled ? "disabled" : "base",
                marginTop: "s2",
              }}
            >
              {action.label}
            </Text>
          ) : (
            action.label
          )}
        </TileButton>
      ))}
    </Box>
  );
};

export default memo(QuickActionsCtasView);
