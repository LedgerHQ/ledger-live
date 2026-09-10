import { useCallback } from "react";
import { Linking, Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { useContactsCurrencySelectionAdapter } from "LLM/features/Contacts/hooks/useContactsCurrencySelectionAdapter";
import type { ContactsAddAddressDrawerStep, ContactsAddAddressFlowDrawerProps } from "./types";

function resolveDrawerStep(
  status: ContactsAddAddressFlowDrawerProps["state"]["status"],
): ContactsAddAddressDrawerStep {
  switch (status) {
    case "closed":
    case "selectingCurrency":
      return "currency";
    case "enteringAddress":
      return "address";
    case "namingAddress":
      return "name";
    case "reviewingAddress":
    case "confirmationRequired":
    case "success":
      return "name";
  }
}

export function useContactsAddAddressFlowDrawerViewModel({
  state,
  eligibleNetworkIds,
  onAddressChange,
  onAddressNameChange,
  onAddressConfirm,
  onBack,
  onClose,
  onContinueFromName,
  onCurrencySelected,
  onQrCodeClick,
}: ContactsAddAddressFlowDrawerProps) {
  const { t } = useTranslation();
  const helpCenterUrl = useLocalizedUrl(urls.resources.helpCenter);
  const handleSanctionedAddressLearnMore = useCallback(() => {
    void Linking.openURL(helpCenterUrl);
  }, [helpCenterUrl]);
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const iosKeyboardGap = 32;
  const bottomOffset =
    isKeyboardVisible && shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? keyboardHeight + (Platform.OS === "ios" ? iosKeyboardGap : 0)
      : 0;
  const currencySelection = useContactsCurrencySelectionAdapter({
    isOpen: state.status === "selectingCurrency",
    networkIds: eligibleNetworkIds,
    onCurrencySelected,
    onSelectionCancelled: onClose,
  });

  return {
    addressEntryProps:
      state.status === "enteringAddress"
        ? {
            addressEntry: state.addressEntry,
            sanctionedAddressBanner: {
              description: t("contacts.addAddressEntry.sanctioned.description"),
              actionLabel: t("contacts.addAddressEntry.sanctioned.learnMore"),
              onAction: handleSanctionedAddressLearnMore,
            },
            bottomOffset,
            onChangeText: onAddressChange,
            onConfirm: onAddressConfirm,
            onQrCodeClick,
          }
        : null,
    addressNameProps:
      state.status === "namingAddress" || state.status === "confirmationRequired"
        ? {
            addressLabel: state.addressLabel,
            bottomOffset,
            onChangeText: onAddressNameChange,
            onContinue: onContinueFromName,
          }
        : null,
    currencySelection,
    currentStep: resolveDrawerStep(state.status),
    isOpen: state.status !== "closed" && state.status !== "success",
    onBack,
    onFlowClose: onClose,
  } as const;
}

export type ContactsAddAddressFlowDrawerViewModel = ReturnType<
  typeof useContactsAddAddressFlowDrawerViewModel
>;
