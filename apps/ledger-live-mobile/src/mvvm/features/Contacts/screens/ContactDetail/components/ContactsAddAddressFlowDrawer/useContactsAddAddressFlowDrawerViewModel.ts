import { useCallback } from "react";
import { Linking, Platform } from "react-native";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { useContactsMeContact } from "@features/platform-contacts";
import { useContactsCurrencySelectionAdapter } from "LLM/features/Contacts/hooks/useContactsCurrencySelectionAdapter";
import type { ContactsAddAddressNameProps } from "@features/flow-contacts-add-address";
import { resolveContactAddressSupportsDomain } from "@features/flow-contacts-detail";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
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
  const helpCenterUrl = useLocalizedUrl(urls.resources.helpCenter);
  const meContact = useContactsMeContact();
  const isMeContact =
    (state.status === "namingAddress" || state.status === "confirmationRequired") &&
    meContact !== undefined &&
    state.selectedContactId === meContact.id;
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
  const addressNameProps: ContactsAddAddressNameProps | null =
    state.status === "namingAddress" || state.status === "confirmationRequired"
      ? {
          addressLabel: state.addressLabel,
          showPrivacyPolicy: isMeContact,
          nextStep: "confirmation",
          bottomOffset,
          onChangeText: onAddressNameChange,
          onContinue: onContinueFromName,
        }
      : null;

  return {
    addressEntryProps:
      state.status === "enteringAddress"
        ? {
            addressEntry: state.addressEntry,
            supportsDomain: resolveContactAddressSupportsDomain(
              state.selectedCurrencyId,
              sendFeatures.supportsDomain,
            ),
            onSanctionedAddressLearnMore: handleSanctionedAddressLearnMore,
            bottomOffset,
            onChangeText: onAddressChange,
            onConfirm: onAddressConfirm,
            onQrCodeClick,
          }
        : null,
    addressNameProps,
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
