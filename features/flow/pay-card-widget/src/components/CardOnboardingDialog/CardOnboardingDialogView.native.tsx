import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Stepper,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardOnboardingOption } from "../CardOnboardingOption/CardOnboardingOption";
import type { CardOnboardingDialogViewProps } from "./useCardOnboardingDialogViewModel";

export function CardOnboardingDialogView({
  isOpen,
  dialogTitle,
  gotItLabel,
  options,
  completedCount,
  totalCount,
  handleClose,
  onboardingCompleted,
  handleGotIt,
}: CardOnboardingDialogViewProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const onClose = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    handleClose();
  }, [handleClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="pay-card-onboarding-sheet"
    >
      {isOpen ? (
        <BottomSheetView testID="pay-card-onboarding-sheet-content">
          <BottomSheetHeader spacing density="expanded" />
          <Box lx={{ marginHorizontal: "s8", marginBottom: "s8" }}>
            <Stepper currentStep={completedCount} totalSteps={totalCount} />
          </Box>
          <Box lx={{ marginHorizontal: "s8", marginBottom: "s8" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {dialogTitle}
            </Text>
          </Box>
          <Box lx={{ flexDirection: "column", marginHorizontal: "s4" }}>
            {options.map(option => (
              <CardOnboardingOption key={option.id} {...option} />
            ))}
          </Box>
          {onboardingCompleted ? (
            <Box lx={{ margin: "s16" }}>
              <Button
                appearance="base"
                size="lg"
                isFull
                onPress={handleGotIt}
                testID="pay-card-onboarding-got-it"
              >
                {gotItLabel}
              </Button>
            </Box>
          ) : null}
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
