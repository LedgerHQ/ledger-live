import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useCallback, useEffect, useMemo } from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { Platform } from "react-native";
import { track } from "~/analytics";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { shouldUseKeyboardAvoidance } from "~/logic/keyboardVisible";
import { useMemoViewModel } from "../../../components/Memo/hooks/useMemoViewModel";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { useSendFlowMessageTracking } from "../../../hooks/useSendFlowMessageTracking";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import {
  getAddressValidationMessageId,
  getMessageIds,
  getSuppressedMessageIds,
} from "../../../utils/messageTracking";
import { useAddressMatchedSectionViewModel } from "./useAddressMatchedSectionViewModel";
import { useRecipientScreenView } from "./useRecipientScreenView";
import { useSettleRecipientInputFocus } from "./useSettleRecipientInputFocus";

export type UseRecipientScreenContentViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
  recipientSupportsDomain: boolean;
  onAddContact: () => void;
}>;

export function useRecipientScreenContentViewModel({
  account,
  parentAccount,
  transaction,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
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
  const { flowSessionId, setRecipientResolution } = useSendFlowTracking();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const trackingProperties = useMemo(
    () => ({
      ...sendFlowTrackingProperties,
      page: "step recipient",
    }),
    [sendFlowTrackingProperties],
  );

  const resolvedAddress = recipient.result.resolvedAddress ?? recipient.searchValue;
  const hasMemo = sendFeatures.hasMemoForRecipient(currency, resolvedAddress);
  const showMemo = hasMemo && recipient.isAddressValid;
  const memo = useMemoViewModel({
    address: showMemo ? resolvedAddress : "",
    hasMemo,
  });
  const hasMemoValidationError = hasMemo && Boolean(memo.memoError);
  const showMatched = recipient.showMatchedAddress && !hasMemoValidationError;
  const activeWarningsTrackingProperties = useMemo(
    () =>
      getActiveWarningsTrackingProperties(
        getMessageIds(recipient.result.bridgeWarnings, "warning"),
      ),
    [recipient.result.bridgeWarnings],
  );

  const handleAddressSelect = recipient.handleAddressSelect;
  const handleMatchedAddress = useCallback(
    (address: string, ensName?: string) => {
      track("button_clicked", {
        ...trackingProperties,
        button: "send",
        resultType: recipient.recipientResolution.resultType,
        recipientType: recipient.recipientResolution.recipientType,
        flow_session_id: flowSessionId,
        ...activeWarningsTrackingProperties,
      });
      setRecipientResolution(
        recipient.recipientResolution.resultType,
        recipient.recipientResolution.recipientType,
      );
      handleAddressSelect(address, ensName);
    },
    [
      activeWarningsTrackingProperties,
      flowSessionId,
      handleAddressSelect,
      recipient.recipientResolution,
      setRecipientResolution,
      trackingProperties,
    ],
  );

  const messageTrackingRequest = useMemo(() => {
    const transactionError = hasMemoValidationError ? memo.memoError : undefined;
    const addressValidationMessageId = getAddressValidationMessageId(
      recipient.addressValidationErrorType,
    );

    const candidates = [
      transactionError ? { messageId: transactionError.name, messageType: "error" as const } : null,
      recipient.showAddressValidationError && addressValidationMessageId
        ? { messageId: addressValidationMessageId, messageType: "error" as const }
        : null,
      recipient.showBridgeSenderError && recipient.bridgeSenderError
        ? { messageId: recipient.bridgeSenderError.name, messageType: "error" as const }
        : null,
      recipient.showSanctionedBanner
        ? { messageId: "sanctioned", messageType: "error" as const }
        : null,
      recipient.showBridgeRecipientError && recipient.bridgeRecipientError
        ? { messageId: recipient.bridgeRecipientError.name, messageType: "error" as const }
        : null,
      recipient.showBridgeRecipientWarning && recipient.bridgeRecipientWarning
        ? { messageId: recipient.bridgeRecipientWarning.name, messageType: "warning" as const }
        : null,
    ].filter(candidate => candidate !== null);

    const primary = candidates[0];
    if (!primary) return null;

    return {
      account,
      parentAccount,
      step: SEND_FLOW_STEP.RECIPIENT,
      message: {
        ...primary,
        suppressedErrors: getSuppressedMessageIds(
          {
            errors: recipient.result.bridgeErrors ?? {},
            warnings: recipient.result.bridgeWarnings ?? {},
          },
          primary.messageId,
          candidates.slice(1).map(candidate => candidate.messageId),
        ),
      },
      metadata: {
        recipientType: recipient.recipientResolution.recipientType,
        recipientLength: recipient.searchValue.length,
        memoLength: showMemo ? memo.memo.value.length : 0,
        memoType: showMemo ? memo.memo.type : null,
      },
    };
  }, [
    account,
    hasMemoValidationError,
    memo.memo.type,
    memo.memo.value.length,
    memo.memoError,
    parentAccount,
    recipient.addressValidationErrorType,
    recipient.bridgeRecipientError,
    recipient.bridgeRecipientWarning,
    recipient.bridgeSenderError,
    recipient.recipientResolution.recipientType,
    recipient.result.bridgeErrors,
    recipient.result.bridgeWarnings,
    recipient.searchValue.length,
    recipient.showAddressValidationError,
    recipient.showBridgeRecipientError,
    recipient.showBridgeRecipientWarning,
    recipient.showBridgeSenderError,
    recipient.showSanctionedBanner,
    showMemo,
  ]);
  useSendFlowMessageTracking({
    step: SEND_FLOW_STEP.RECIPIENT,
    request: messageTrackingRequest,
    isTransient: recipient.isLoading,
    immediate: messageTrackingRequest?.message.messageId === "sanctioned",
  });

  const handleAddContact = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "add contact",
      addressAlreadyUsed: recipient.recipientResolution.addressAlreadyUsed,
    });
    onAddContact();
  }, [onAddContact, recipient.recipientResolution.addressAlreadyUsed, trackingProperties]);

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
    onAddContact: handleAddContact,
    onUnsupportedNetwork: recipient.handleUnsupportedNetwork,
    onDismissUnsupportedNetwork: recipient.handleDismissUnsupportedNetwork,
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
