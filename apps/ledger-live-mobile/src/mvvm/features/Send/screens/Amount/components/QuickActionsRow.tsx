import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AmountScreenQuickAction } from "../types";

type QuickActionsRowProps = Readonly<{
  actions: readonly AmountScreenQuickAction[];
}>;

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
          onPress={action.onPress}
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
