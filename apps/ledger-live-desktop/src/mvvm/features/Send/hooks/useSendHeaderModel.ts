import { SendFlowStep, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { t } from "i18next";
import { useMemo, useCallback, useRef } from "react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { getRecipientSearchPrefillValue } from "@ledgerhq/live-common/flows/send/utils";
import { getRecipientHeaderPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import type { RecipientHeaderContact } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import { useContactsFeature } from "@features/platform-contacts";
import { selectContacts } from "@domain/entity-contact";
import { useSelector } from "LLD/hooks/redux";
import { buildTransactionPatchFromURIScheme } from "@ledgerhq/live-common/flows/send/utils/uriScheme";
import {
  SendFlowBusinessContext,
  useSendFlowActions,
  useSendFlowData,
} from "../context/SendFlowContext";
import { SendStepConfig } from "../types";
import BigNumber from "bignumber.js";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { track, trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { useRecipientScanner } from "../context/RecipientScannerContext";
import { useRecipientContactSelection } from "../context/RecipientContactSelectionContext";

type UseSendHeaderModelParams = Readonly<{
  availableText: string;
  resetViewState: () => void;
}>;
type UseSendHeaderModelResult = Readonly<{
  addressInputValue: string | undefined;
  descriptionText: string | undefined;
  handleBack: () => void;
  handleRecipientInputClick: () => void;
  handleRecipientInputChange: (value: string) => void;
  handleQrCodeClick: () => void;
  handleScanPicked: (code: string) => void;
  isScannerOpen: boolean;
  recipientContact: RecipientHeaderContact | undefined;
  recipientPlaceholder: string;
  showBackButton: boolean;
  showRecipientInput: boolean;
  showMemoControls: boolean;
  title: string | undefined;
  transactionErrorName: string | undefined;
  transactionError: Error | undefined;
}>;

function getRecipientPlaceholderKey({
  supportsDomain,
  canSearchContacts,
}: Readonly<{ supportsDomain: boolean; canSearchContacts: boolean }>): string {
  if (canSearchContacts) {
    return supportsDomain
      ? "newSendFlow.placeholderWithContacts"
      : "newSendFlow.placeholderNoEnsWithContacts";
  }
  return supportsDomain ? "newSendFlow.placeholder" : "newSendFlow.placeholderNoENS";
}

export function useSendHeaderModel({
  availableText,
  resetViewState,
}: UseSendHeaderModelParams): UseSendHeaderModelResult {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch, isRecipientAddressComplete } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { isScannerOpen, closeScanner, toggleScanner } = useRecipientScanner();
  const { selectedContact, clearSelectedContact } = useRecipientContactSelection();
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("desktop");
  const contacts = useSelector(selectContacts);

  const currencyName = state.account.currency?.ticker ?? "";
  const accountName = useMaybeAccountName(state.account.account ?? undefined);

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig;
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const isSelectingContactAddress = isRecipientStep && selectedContact !== undefined;
  const showRecipientInput =
    (currentStepConfig?.addressInput ?? false) && !isSelectingContactAddress;
  const showMemoControls = Boolean(
    showRecipientInput &&
    uiConfig.hasMemo &&
    recipientSearch.value.length > 0 &&
    isRecipientAddressComplete,
  );

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  const hasFiredMemoPageViewRef = useRef(false);
  if (showMemoControls && !hasFiredMemoPageViewRef.current) {
    hasFiredMemoPageViewRef.current = true;
    trackPage("Modal send - step memo", null, trackingProperties);
  } else if (!showMemoControls) {
    hasFiredMemoPageViewRef.current = false;
  }

  const backTarget = currentStepConfig?.backTarget;

  const showBackButton = isSelectingContactAddress || navigation.canGoBack();

  const showTitle = currentStepConfig?.showTitle !== false;

  const accountSummary = useMemo(() => {
    if (accountName && availableText) return `${accountName} · ${availableText}`;
    return accountName || availableText || "";
  }, [accountName, availableText]);

  const titleKey = currentStepConfig?.titleKey ?? "newSendFlow.title";
  const showAvailable = currentStepConfig?.showAvailable ?? true;

  const title = isSelectingContactAddress
    ? t("newSendFlow.selectAddress")
    : showTitle
      ? t(titleKey, { currency: currencyName })
      : "";

  const descriptionText = isSelectingContactAddress
    ? selectedContact.name
    : showTitle && showAvailable && accountSummary
      ? accountSummary
      : "";

  const handleBack = useCallback(() => {
    closeScanner();

    if (isSelectingContactAddress) {
      clearSelectedContact();
      return;
    }

    // Per-step state cleanup that runs regardless of whether navigation uses backTarget
    // or goToPreviousStep, so floating steps and regular steps are treated uniformly
    if (currentStep === SEND_FLOW_STEP.AMOUNT) {
      // Reset amount-related fields so they don't persist when the screen remounts
      transaction.updateTransaction(tx => ({
        ...tx,
        amount: new BigNumber(0),
        useAllAmount: false,
        feesStrategy: null,
      }));
      resetViewState();
    } else if (currentStep === SEND_FLOW_STEP.COIN_CONTROL) {
      // Reset UTXO exclusions so the selection doesn't bleed into the next visit
      transaction.updateTransaction(tx => {
        if (!("utxoStrategy" in tx)) return tx;
        return { ...tx, utxoStrategy: { ...tx.utxoStrategy, excludeUTXOs: [] } };
      });
    }

    if (backTarget) {
      navigation.goToStep(backTarget);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [
    backTarget,
    clearSelectedContact,
    close,
    closeScanner,
    currentStep,
    isSelectingContactAddress,
    navigation,
    resetViewState,
    transaction,
  ]);

  const recipientHeader = useMemo(
    () =>
      getRecipientHeaderPresentation({
        recipient: state.recipient,
        contacts,
        currencyId: state.account.currency?.id,
        isContactsFeatureEnabled: isContactsFeatureEnabled && isAmountStep,
      }),
    [contacts, isAmountStep, isContactsFeatureEnabled, state.account.currency?.id, state.recipient],
  );

  const addressInputValue = useMemo(() => {
    if (isRecipientStep) return recipientSearch.value;
    if (isAmountStep) return recipientHeader.label;
    return recipientSearch.value;
  }, [isRecipientStep, isAmountStep, recipientHeader.label, recipientSearch.value]);

  const handleRecipientInputClick = useCallback(() => {
    if (!isAmountStep) return;

    const prefillValue = getRecipientSearchPrefillValue(state.recipient);
    if (prefillValue) {
      recipientSearch.setValue(prefillValue);
    }

    handleBack();
  }, [handleBack, isAmountStep, recipientSearch, state.recipient]);

  const showScanner = isScannerOpen && isRecipientStep;

  const handleQrCodeClick = useCallback(() => {
    track(
      isScannerOpen ? "Send Flow QR Code Closed" : "Send Flow QR Code Opened",
      trackingProperties,
    );
    toggleScanner();
  }, [isScannerOpen, toggleScanner, trackingProperties]);

  const handleRecipientInputChange = useCallback(
    (value: string) => {
      recipientSearch.setValue(value);
      if (value.length > 0) closeScanner();
    },
    [closeScanner, recipientSearch],
  );

  const handleScanPicked = useCallback(
    (code: string) => {
      const decoded = decodeURIScheme(code);
      recipientSearch.setValue(decoded.address);

      const currentTransaction = state.transaction.transaction;
      if (currentTransaction) {
        const patch = buildTransactionPatchFromURIScheme(currentTransaction, decoded);
        if (Object.keys(patch).length > 0) {
          transaction.updateTransaction(tx => ({ ...tx, ...patch }) as typeof tx);
        }
      }

      closeScanner();
    },
    [closeScanner, recipientSearch, state.transaction.transaction, transaction],
  );

  const transactionError = state.transaction.status?.errors?.transaction;
  const transactionErrorName = transactionError?.name;

  const canSearchContacts =
    isContactsFeatureEnabled && sendFeatures.hasAddressBook(state.account.currency ?? undefined);
  const recipientPlaceholder = t(
    getRecipientPlaceholderKey({
      supportsDomain: uiConfig.recipientSupportsDomain,
      canSearchContacts,
    }),
  );

  return {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen: showScanner,
    recipientContact: recipientHeader.contact,
    recipientPlaceholder,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError: transactionError instanceof Error ? transactionError : undefined,
  };
}
