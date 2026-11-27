import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetHeader, BottomSheetView, Button } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { FeeSelectionCustomFees } from "../FeeSelectionCustomFees";
import { FeeSelectionStepView } from "./FeeSelectionStepView";
import { useFeeSelectionStepViewModel } from "./useFeeSelectionStepViewModel";
import type { FeeSelectionStepProps } from "./types";

type Props = FeeSelectionStepProps &
  Readonly<{
    isCustomFeesOpen: boolean;
    onOpenCustomFees: () => void;
    onCloseCustomFees: () => void;
  }>;

export function FeeSelectionSheet({
  isOpen,
  onReject,
  onHidden,
  isCustomFeesOpen,
  onOpenCustomFees,
  onCloseCustomFees,
  ...params
}: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const viewModel = useFeeSelectionStepViewModel({ ...params, onOpenCustomFees });

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onReject}
      onModalHide={onHidden}
      hasBackButton={isCustomFeesOpen}
      onBack={onCloseCustomFees}
      enableDynamicSizing
      testID="wallet-api-fee-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
        <BottomSheetHeader
          density="compact"
          title={isCustomFeesOpen ? viewModel.customFeesTitle : viewModel.title}
        />
        {isCustomFeesOpen ? (
          <FeeSelectionCustomFees {...viewModel.customFees} onConfirm={onCloseCustomFees} />
        ) : (
          <Box lx={{ gap: "s24" }}>
            <FeeSelectionStepView
              amountLabel={viewModel.amountLabel}
              amount={viewModel.amount}
              totalLabel={viewModel.totalLabel}
              total={viewModel.total}
              feeOptions={viewModel.feeOptions}
              error={viewModel.error}
            />
            <Button
              appearance="base"
              size="lg"
              onPress={viewModel.onContinue}
              disabled={!viewModel.canContinue}
              testID="wallet-api-fee-step-continue"
            >
              {viewModel.continueLabel}
            </Button>
          </Box>
        )}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
