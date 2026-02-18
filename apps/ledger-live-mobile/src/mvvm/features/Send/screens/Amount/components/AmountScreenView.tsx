import React, { useCallback } from "react";
import { View } from "react-native";
import { Button, Divider } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { AmountInputSection } from "./AmountInputSection";
import { QuickActionsRow } from "./QuickActionsRow";
import { NetworkFeesRow } from "./NetworkFeesRow";
import { NumberKeyboard } from "./NumberKeyboard";
import type { AmountScreenViewModel } from "../types";
import { useTranslation } from "~/context/Locale";

type AmountScreenViewProps = Readonly<{
  viewModel: Extract<AmountScreenViewModel, { ready: true }>;
}>;

export function AmountScreenView({ viewModel }: AmountScreenViewProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
      },
      upperSection: {
        flex: 0,
      },
      middleSection: {
        flex: 1,
        justifyContent: "center",
      },
      bottomSection: {
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      const currentValue = viewModel.amountInput.value;

      if (key === "delete") {
        const newValue = currentValue.slice(0, -1);
        viewModel.amountInput.onChangeText(newValue);
      } else if (key === ".") {
        if (currentValue.includes(".") || currentValue.includes(",")) {
          return;
        }
        const newValue = currentValue ? `${currentValue}.` : "0.";
        viewModel.amountInput.onChangeText(newValue);
      } else {
        const newValue =
          currentValue === "0" || currentValue === "" ? key : `${currentValue}${key}`;
        viewModel.amountInput.onChangeText(newValue);
      }
    },
    [viewModel.amountInput],
  );

  return (
    <View style={styles.container}>
      <View style={styles.upperSection}>
        <AmountInputSection
          viewModel={viewModel.amountInput}
          message={viewModel.message}
          toggleLabel={t("send.amount.toggleCurrency")}
        />
      </View>

      <View style={styles.middleSection}>
        <NetworkFeesRow viewModel={viewModel.networkFees} />
        <Divider />

        {viewModel.quickActions.show ? (
          <QuickActionsRow actions={viewModel.quickActions.actions} />
        ) : null}

        <NumberKeyboard
          onKeyPress={handleKeyPress}
          allowDecimal={viewModel.amountInput.maxDecimalLength > 0}
        />
      </View>

      <View style={styles.bottomSection}>
        <Button
          appearance="base"
          size="lg"
          onPress={viewModel.reviewButton.onPress}
          disabled={viewModel.reviewButton.disabled}
          loading={viewModel.reviewButton.loading}
          icon={viewModel.reviewButton.showIcon ? LedgerLogo : undefined}
        >
          {viewModel.reviewButton.loading ? "" : viewModel.reviewButton.label}
        </Button>
      </View>
    </View>
  );
}
