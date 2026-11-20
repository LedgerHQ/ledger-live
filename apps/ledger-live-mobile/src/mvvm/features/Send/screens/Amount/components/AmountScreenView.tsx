import React, { useCallback, useState, type ReactNode } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";
import { Button, Divider } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet, useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { AmountInputSection, getAmountInputCompactSaving } from "./AmountInputSection";
import { QuickActionsRow } from "./QuickActionsRow";
import { NetworkFeesRow } from "../../../components/NetworkFeesRow";
import { NumberKeyboard, getNumberKeyboardCompactSaving } from "./NumberKeyboard";
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
  feesFooterRow?: ReactNode;
}>;

export function AmountScreenView({ viewModel, feesFooterRow }: AmountScreenViewProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
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
      amountBlock: {
        flexGrow: 1,
        justifyContent: "center",
      },
      keyboard: {
        flexShrink: 0,
      },
    }),
    [],
  );
  const [availableHeight, onAvailableLayout] = useMeasuredHeight();
  const [amountHeight, onAmountLayout] = useMeasuredHeight();
  const [feesHeight, onFeesLayout] = useMeasuredHeight();
  const [quickActionsHeight, onQuickActionsLayout] = useMeasuredHeight();
  const { theme } = useTheme();
  const [compact, setCompact] = useState(false);
  const layout = resolveAmountScreenStack({
    requestedQuickActions: viewModel.quickActions.show,
    heights: { availableHeight, amountHeight, feesHeight, quickActionsHeight },
    compact,
    compactSavings: {
      keyboard: getNumberKeyboardCompactSaving(theme.spacings),
      amount: getAmountInputCompactSaving(theme.spacings, viewModel.message !== null),
    },
  });
  if (layout.compact !== compact) {
    setCompact(layout.compact);
  }
  const { scrollEnabled, pinQuickActions } = layout;
  const quickActions = viewModel.quickActions.show ? (
    <View onLayout={onQuickActionsLayout}>
      <QuickActionsRow actions={viewModel.quickActions.actions} />
    </View>
  ) : null;

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
      <View style={styles.flexible} onLayout={onAvailableLayout}>
        <ScrollView
          style={styles.flexible}
          contentContainerStyle={styles.flexibleContent}
          scrollEnabled={scrollEnabled}
          bounces={false}
          showsVerticalScrollIndicator={scrollEnabled}
        >
          <View style={styles.amountBlock}>
            <View onLayout={onAmountLayout}>
              <AmountInputSection
                viewModel={viewModel.amountInput}
                message={viewModel.message}
                toggleLabel={t("send.amount.toggleCurrency")}
                compact={compact}
              />
            </View>
          </View>

          <View>
            <View onLayout={onFeesLayout}>
              <NetworkFeesRow
                viewModel={viewModel.networkFees}
                sponsored={viewModel.sponsoredFee}
                sponsoredRentNotice={viewModel.sponsoredRentNotice}
              />
              {feesFooterRow}
              <Divider />
            </View>

            {!pinQuickActions && quickActions}
          </View>
        </ScrollView>

        {pinQuickActions && quickActions}
      </View>

      <View style={styles.keyboard}>
        <NumberKeyboard
          onKeyPress={handleKeyPress}
          allowDecimal={viewModel.amountInput.maxDecimalLength > 0}
          compact={compact}
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
