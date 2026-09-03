import { shouldShowMatchedAddress } from "@ledgerhq/live-common/flows/send/recipient/utils/shouldShowMatchedAddress";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo } from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { Platform } from "react-native";
import { track } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { shouldUseKeyboardAvoidance } from "~/logic/keyboardVisible";
import { useMemoViewModel } from "../../../components/Memo/hooks/useMemoViewModel";
import { useAddressMatchedSectionViewModel } from "./useAddressMatchedSectionViewModel";
import { useRecipientScreenView } from "./useRecipientScreenView";
import { useSettleRecipientInputFocus } from "./useSettleRecipientInputFocus";

export type UseRecipientScreenContentViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
  recipientSupportsDomain: boolean;
  onMemoProceed: () => void;
  onAddContact: () => void;
}>;

export function useRecipientScreenContentViewModel({
  account,
  parentAccount,
  transaction,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
  onMemoProceed,
  onAddContact,
}: UseRecipientScreenContentViewModelProps) {
  const recipient = useRecipientScreenView({
    account,
    parentAccount,
    transaction,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });
  const trackingProperties = useMemo(
    () => ({
      ...getSendFlowTrackingProperties(account, parentAccount),
      button: "my accounts",
      page: "step recipient",
    }),
    [account, parentAccount],
  );

  const handleSkipMemo = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "skip",
      page: "step memo",
    });
    onMemoProceed();
  }, [onMemoProceed, trackingProperties]);

  const resolvedAddress = recipient.result.resolvedAddress ?? recipient.searchValue;
  const hasMemo = sendFeatures.hasMemoForRecipient(currency, resolvedAddress);
  const showMemo = hasMemo && recipient.isAddressValid;
  const memo = useMemoViewModel({
    address: showMemo ? resolvedAddress : "",
    hasMemo,
    onSkip: handleSkipMemo,
  });
  const showMatched = shouldShowMatchedAddress({
    showMatchedAddress: recipient.showMatchedAddress,
    hasMemo,
    hasFilledMemo: memo.hasFilledMemo,
    hasMemoError: Boolean(memo.memoError),
  });

  const handleAddressSelect = recipient.handleAddressSelect;
  const handleMatchedAddress = useCallback(
    (address: string, ensName?: string) => {
      track("button_clicked", trackingProperties);
      handleAddressSelect(address, ensName);
    },
    [trackingProperties, handleAddressSelect],
  );

  const addressMatchedSectionViewModel = useAddressMatchedSectionViewModel({
    searchResult: recipient.result,
    searchValue: recipient.searchValue,
    onSelect: handleMatchedAddress,
    isSanctioned: recipient.showSanctionedBanner,
    isAddressComplete: recipient.isAddressComplete,
    hasBridgeError: recipient.showBridgeRecipientError,
    isContactsFeatureEnabled: recipient.isContactsFeatureEnabled,
    hasAddressBook: recipient.hasAddressBook,
    addressBookFamilyName: recipient.addressBookFamilyName,
    onAddContact,
  });

  useEffect(() => {
    if (showMemo) {
      track("send_modal", { ...trackingProperties, name: "step memo" });
    }
  }, [showMemo, trackingProperties]);

  useEffect(() => {
    if (hasMemo && memo.hasFilledMemo && !memo.memoError) {
      track("send_modal", {
        ...trackingProperties,
        button: "skip",
        name: "step memo",
      });
    }
  }, [trackingProperties, hasMemo, memo.hasFilledMemo, memo.memoError]);

  const shouldShowErrorBanner =
    !recipient.isLoading &&
    (recipient.showBridgeSenderError ||
      recipient.showSanctionedBanner ||
      recipient.showBridgeRecipientError ||
      recipient.showBridgeRecipientWarning);

  const hasContent =
    !recipient.showInitialState ||
    recipient.isLoading ||
    recipient.showContactsList ||
    recipient.showEmptyContactsState ||
    recipient.featureIntroduction.isOpen ||
    Boolean(recipient.clipboardAddress);

  useSettleRecipientInputFocus(hasContent);

  const keyboardBehavior: KeyboardAvoidingViewProps["behavior"] = shouldUseKeyboardAvoidance(
    Platform.OS,
    Platform.Version,
  )
    ? "padding"
    : undefined;

  return {
    recipient,
    memo,
    showMemo,
    showMatched,
    shouldShowErrorBanner,
    keyboardBehavior,
    addressMatchedSectionViewModel,
  };
}

export type RecipientScreenContentViewModel = ReturnType<typeof useRecipientScreenContentViewModel>;
