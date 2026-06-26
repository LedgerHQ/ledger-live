import React, { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
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
  const styles = useStyleSheet(
    theme => ({
      container: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: theme.spacings.s16,
        marginTop: theme.spacings.s12,
      },
      action: {
        flex: 1,
        paddingHorizontal: theme.spacings.s20,
        paddingVertical: theme.spacings.s12,
        borderRadius: 999,
        backgroundColor: theme.colors.bg.muted,
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
      },
      actionActive: {
        backgroundColor: theme.colors.bg.active,
      },
      actionDisabled: {
        backgroundColor: theme.colors.bg.disabled,
        opacity: 0.5,
      },
    }),
    [],
  );

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
    <View style={styles.container}>
      {actions.map(action => (
        <Pressable
          key={action.id}
          style={[
            styles.action,
            action.active && styles.actionActive,
            action.disabled && styles.actionDisabled,
          ]}
          onPress={() => handleOnPress(action.id, action.onPress, action.untracked)}
          disabled={action.disabled}
        >
          <Text
            typography="body2SemiBold"
            lx={{
              color: action.active ? "onAccent" : action.disabled ? "disabled" : "base",
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
