import React from "react";
import { View, Pressable } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text, InteractiveIcon } from "@ledgerhq/lumen-ui-rnative";
import { ArrowsUpDown } from "@ledgerhq/lumen-ui-rnative/symbols";

type AmountDisplayProps = Readonly<{
  amountValue: string;
  currencyText: string;
  currencyPosition: "left" | "right";
  secondaryValue: string;
  onToggleInputMode: () => void;
  toggleLabel: string;
}>;

export function AmountDisplay({
  amountValue,
  currencyText,
  currencyPosition,
  secondaryValue,
  onToggleInputMode,
  toggleLabel,
}: AmountDisplayProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        alignItems: "center" as const,
        paddingTop: theme.spacings.s32,
        paddingHorizontal: theme.spacings.s16,
      },
      amountRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        position: "relative" as const,
        marginBottom: theme.spacings.s8,
      },
      amountText: {
        fontSize: 56,
        lineHeight: 64,
        fontWeight: "600" as const,
        color: theme.colors.text.base,
      },
      currencyText: {
        fontSize: 56,
        lineHeight: 64,
        fontWeight: "600" as const,
        color: theme.colors.text.base,
        marginLeft: currencyPosition === "left" ? 0 : theme.spacings.s8,
        marginRight: currencyPosition === "left" ? theme.spacings.s8 : 0,
      },
      toggleButton: {
        position: "absolute" as const,
        right: 0,
        top: 0,
      },
      secondaryText: {
        color: theme.colors.text.muted,
      },
    }),
    [currencyPosition],
  );

  const displayText = amountValue || "0";

  return (
    <View style={styles.container}>
      <View style={styles.amountRow}>
        {currencyPosition === "left" ? (
          <>
            <Text style={styles.currencyText}>{currencyText}</Text>
            <Text style={styles.amountText}>{displayText}</Text>
          </>
        ) : (
          <>
            <Text style={styles.amountText}>{displayText}</Text>
            <Text style={styles.currencyText}>{currencyText}</Text>
          </>
        )}
        <View style={styles.toggleButton}>
          <InteractiveIcon iconType="stroked" onPress={onToggleInputMode} accessibilityLabel={toggleLabel}>
            <ArrowsUpDown size={24} />
          </InteractiveIcon>
        </View>
      </View>
      <Text typography="body2" style={styles.secondaryText}>
        {secondaryValue}
      </Text>
    </View>
  );
}
