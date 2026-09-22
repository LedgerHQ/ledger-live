import React, { useCallback } from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { AmountScreenQuickAction } from "../types";
import { track } from "~/analytics";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";

type QuickActionsRowProps = Readonly<{
  actions: readonly AmountScreenQuickAction[];
}>;

function toTrackButtonLabel(id: string): string {
  switch (id) {
    case "quarter":
      return "25%";
    case "half":
      return "50%";
    case "threeQuarters":
      return "75%";
    default:
      return id;
  }
}

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  const trackingProperties = useSendFlowTrackingProperties();

  const handleOnPress = useCallback(
    (actionId: string, onPress: () => void, untracked?: boolean) => {
      if (untracked) {
        onPress();
        return;
      }

      track("button_clicked", {
        ...trackingProperties,
        button: toTrackButtonLabel(actionId),
        page: "step amount",
        flow: "send",
      });
      onPress();
    },
    [trackingProperties],
  );

  return (
    <Box
      testID="send-quick-actions-row"
      lx={{ flexDirection: "row", gap: "s12", marginTop: "s12" }}
    >
      {actions.map(action => (
        <Button
          key={action.id}
          testID={`send-quick-actions-${action.id}`}
          appearance={action.active ? "accent" : "gray"}
          size="sm"
          disabled={action.disabled}
          onPress={() => handleOnPress(action.id, action.onPress, action.untracked)}
          lx={{ flex: 1 }}
        >
          {action.label}
        </Button>
      ))}
    </Box>
  );
}
