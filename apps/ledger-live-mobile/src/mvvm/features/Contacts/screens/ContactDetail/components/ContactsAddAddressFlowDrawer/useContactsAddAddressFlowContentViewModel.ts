import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { ModularDrawerFlowRenderProps } from "LLM/features/ModularDrawer";
import type { ContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";

type UseContactsAddAddressFlowContentViewModelOptions = Readonly<{
  viewModel: ContactsAddAddressFlowDrawerViewModel;
  currencyShell: ModularDrawerFlowRenderProps;
}>;

export function useContactsAddAddressFlowContentViewModel({
  viewModel,
  currencyShell,
}: UseContactsAddAddressFlowContentViewModelOptions) {
  const { currentStep, onBack: onFlowBack } = viewModel;
  const {
    hasBackButton: hasCurrencyBackButton,
    onBack: onCurrencyBack,
    onClose: onCurrencyClose,
  } = currencyShell;
  const handleBack = useCallback(() => {
    if (currentStep !== "currency") {
      onFlowBack();
    } else if (hasCurrencyBackButton) {
      onCurrencyBack();
    } else {
      onCurrencyClose();
    }
  }, [currentStep, hasCurrencyBackButton, onCurrencyBack, onCurrencyClose, onFlowBack]);
  const handleClose = useCallback(() => {
    if (currentStep === "currency") {
      onCurrencyClose();
    }
  }, [currentStep, onCurrencyClose]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });

      return () => subscription.remove();
    }, [handleBack]),
  );

  return {
    ...viewModel,
    currencyShell,
    onBack: handleBack,
    onClose: handleClose,
  } as const;
}

export type ContactsAddAddressFlowContentViewModel = ReturnType<
  typeof useContactsAddAddressFlowContentViewModel
>;
