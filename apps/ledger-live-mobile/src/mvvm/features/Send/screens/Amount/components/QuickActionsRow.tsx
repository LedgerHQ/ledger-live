import React, { useCallback, useMemo } from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { AmountScreenQuickAction } from "../types";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowData } from "../../../context/SendFlowContext";

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
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account, parentAccount);
  }, [account, parentAccount]);

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
    [track, trackingProperties],
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
