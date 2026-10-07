import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Button, Divider } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { AmountInputSection } from "./AmountInputSection";
import { QuickActionsRow } from "./QuickActionsRow";
import { NetworkFeesRow } from "../../../components/NetworkFeesRow";
import { NumberKeyboard } from "./NumberKeyboard";
import { resolveAmountScreenStack } from "./amountScreenLayout";
import type { AmountScreenViewModel } from "../types";
import { useTranslation } from "~/context/Locale";

function useMeasuredHeight() {
  const [height, setHeight] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setHeight(current => (current === nextHeight ? current : nextHeight));
  }, []);
  return [height, onLayout] as const;
}

type AmountScreenViewProps = Readonly<{
  viewModel: Extract<AmountScreenViewModel, { ready: true }>;
}>;

export function AmountScreenView({ viewModel }: AmountScreenViewProps) {
  const { t } = useTranslation();
  const [viewportHeight, onViewportLayout] = useMeasuredHeight();
  const [amountHeight, onAmountLayout] = useMeasuredHeight();
  const [feesHeight, onFeesLayout] = useMeasuredHeight();
  const [quickActionsHeight, onQuickActionsLayout] = useMeasuredHeight();
  const { scrollEnabled } = resolveAmountScreenStack({
    requestedQuickActions: viewModel.quickActions.show,
    heights: { viewportHeight, amountHeight, feesHeight, quickActionsHeight },
  });

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
      <ScrollView
        style={styles.flexible}
        contentContainerStyle={styles.flexibleContent}
        scrollEnabled={scrollEnabled}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onLayout={onViewportLayout}
      >
        <View onLayout={onAmountLayout}>
          <AmountInputSection
            viewModel={viewModel.amountInput}
            message={viewModel.message}
            toggleLabel={t("send.amount.toggleCurrency")}
          />
        </View>

        <View style={styles.feesBlock}>
          <View onLayout={onFeesLayout}>
            <NetworkFeesRow viewModel={viewModel.networkFees} />
            <Divider />
          </View>

          {viewModel.quickActions.show && (
            <View onLayout={onQuickActionsLayout}>
              <QuickActionsRow actions={viewModel.quickActions.actions} />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.keyboard}>
        <NumberKeyboard
          onKeyPress={handleKeyPress}
          allowDecimal={viewModel.amountInput.maxDecimalLength > 0}
        />
      </View>

      <View>
        <Button
          testID={
            viewModel.reviewButton.disabled
              ? "disabled-amount-continue-button"
              : "enabled-amount-continue-button"
          }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexible: {
    flex: 1,
    minHeight: 0,
  },
  flexibleContent: {
    flexGrow: 1,
  },
  feesBlock: {
    flexGrow: 1,
    justifyContent: "center",
  },
  keyboard: {
    flexShrink: 0,
  },
});
