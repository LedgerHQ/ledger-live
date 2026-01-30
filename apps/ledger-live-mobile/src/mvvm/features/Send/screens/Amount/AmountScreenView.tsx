import React, { useCallback } from "react";
import { View } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { AmountDisplay } from "./components/AmountDisplay";
import { QuickActionsRow } from "./components/QuickActionsRow";
import { NumericKeypad } from "./components/NumericKeypad";
import { ReviewButton } from "./components/ReviewButton";
import type { AmountScreenViewModel } from "./useAmountScreenViewModel";

type AmountScreenViewProps = AmountScreenViewModel &
  Readonly<{
    onReview: () => void;
  }>;

export function AmountScreenView({
  amountValue,
  amountInputMaxDecimalLength,
  currencyText,
  currencyPosition,
  onChangeText,
  onToggleInputMode,
  toggleLabel,
  secondaryValue,
  quickActions,
  showQuickActions,
  reviewLabel,
  reviewDisabled,
  reviewLoading,
  onReview,
}: AmountScreenViewProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      content: {
        flex: 1,
        justifyContent: "space-between" as const,
      },
      topSection: {
        flex: 1,
      },
      bottomSection: {
        paddingBottom: theme.spacings.s8,
      },
    }),
    [],
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "backspace") {
        onChangeText(amountValue.slice(0, -1));
      } else if (key === ".") {
        // Only add decimal point if there isn't one already
        if (!amountValue.includes(".")) {
          onChangeText(amountValue + key);
        }
      } else {
        // Check decimal length limit
        const decimalIndex = amountValue.indexOf(".");
        if (decimalIndex !== -1) {
          const decimals = amountValue.slice(decimalIndex + 1);
          if (decimals.length >= amountInputMaxDecimalLength) {
            return; // Don't add more decimals
          }
        }
        onChangeText(amountValue + key);
      }
    },
    [amountValue, amountInputMaxDecimalLength, onChangeText],
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <AmountDisplay
            amountValue={amountValue}
            currencyText={currencyText}
            currencyPosition={currencyPosition}
            secondaryValue={secondaryValue}
            onToggleInputMode={onToggleInputMode}
            toggleLabel={toggleLabel}
          />
          {showQuickActions ? <QuickActionsRow actions={quickActions} /> : null}
        </View>
        <View style={styles.bottomSection}>
          <NumericKeypad onKeyPress={handleKeyPress} maxDecimalLength={amountInputMaxDecimalLength} />
          <ReviewButton
            label={reviewLabel}
            disabled={reviewDisabled}
            loading={reviewLoading}
            onPress={onReview}
          />
        </View>
      </View>
    </View>
  );
}
