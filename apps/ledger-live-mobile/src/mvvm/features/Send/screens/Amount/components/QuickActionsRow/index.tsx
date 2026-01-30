import React from "react";
import { View, Pressable } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import type { AmountScreenQuickAction } from "@ledgerhq/live-common/flows/send/screens/amount/types";

type QuickActionsRowProps = Readonly<{
  actions: AmountScreenQuickAction[];
}>;

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flexDirection: "row" as const,
        gap: theme.spacings.s8,
        paddingHorizontal: theme.spacings.s16,
        marginTop: theme.spacings.s24,
      },
      button: {
        flex: 1,
        paddingVertical: theme.spacings.s12,
        paddingHorizontal: theme.spacings.s16,
        borderRadius: theme.radii.r24,
        backgroundColor: theme.colors.bg.raised,
        alignItems: "center" as const,
        justifyContent: "center" as const,
      },
      buttonActive: {
        backgroundColor: theme.colors.bg.brand.default,
      },
      buttonDisabled: {
        opacity: 0.5,
      },
      buttonText: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: theme.colors.text.base,
      },
      buttonTextActive: {
        color: theme.colors.text.onBrand,
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
            styles.button,
            action.active && styles.buttonActive,
            action.disabled && styles.buttonDisabled,
          ]}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ selected: action.active, disabled: action.disabled }}
        >
          <Text style={[styles.buttonText, action.active && styles.buttonTextActive]}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
