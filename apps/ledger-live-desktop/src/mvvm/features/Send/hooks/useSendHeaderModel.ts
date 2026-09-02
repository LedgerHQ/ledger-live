import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { t } from "~/renderer/i18n/init";
import { useMemo, useCallback, useRef } from "react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { getRecipientSearchPrefillValue } from "@ledgerhq/live-common/flows/send/utils";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { getRecipientHeaderPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import type { RecipientHeaderContact } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useContactsFeature } from "@features/platform-contacts";
import { selectContacts } from "@domain/entity-contact";
import { useSelector } from "LLD/hooks/redux";
import { buildTransactionPatchFromURIScheme } from "@ledgerhq/live-common/flows/send/utils/uriScheme";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
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
import { useAddNewContactHeaderState } from "../context/AddNewContactHeaderContext";
import { useSendFlowTracking } from "../context/SendFlowTrackingContext";
import { getSendFlowTrackingPage } from "../utils/contactTracking";

type UseSendHeaderModelParams = Readonly<{
  availableText: string;
  resetViewState: () => void;
}>;
type UseSendHeaderModelResult = Readonly<{
  addressInputValue: string | undefined;
  descriptionText: string | undefined;
  handleBack: () => void;
  handleClose: () => void;
  handleRecipientInputClick: () => void;
  handleRecipientInputChange: (value: string) => void;
  handleRecipientPaste: () => void;
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

function resolveHeaderTitle({
  isSelectingContactAddress,
  showTitle,
  titleKey,
  currencyName,
  memoLabel,
}: Readonly<{
  isSelectingContactAddress: boolean;
  showTitle: boolean;
  titleKey: string;
  currencyName: string;
  memoLabel: string;
}>): string {
  if (isSelectingContactAddress) return t("newSendFlow.selectAddress");
  if (!showTitle) return "";
  return t(titleKey, { currency: currencyName, memoLabel });
}

function resolveHeaderDescription({
  isSelectingContactAddress,
  selectedContactName,
  showTitle,
  showAvailable,
  accountSummary,
}: Readonly<{
  isSelectingContactAddress: boolean;
  selectedContactName: string | undefined;
  showTitle: boolean;
  showAvailable: boolean;
  accountSummary: string;
}>): string {
  if (isSelectingContactAddress) return selectedContactName ?? "";
  if (showTitle && showAvailable && accountSummary) return accountSummary;
  return "";
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
  const { recipientType, setInputMethod } = useSendFlowTracking();
  const addNewContactHeader = useAddNewContactHeaderState();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("desktop");
  const contacts = useSelector(selectContacts);

  const currencyName = state.account.currency?.ticker ?? "";
  const memoCurrencyId = getMemoFamilyCurrencyId(state.account.currency);
  const memoLabel = t([`families.${memoCurrencyId}.memo`, "common.memo"]);
  const accountName = useMaybeAccountName(state.account.account ?? undefined);

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig;
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const isContactAddressFlowStep =
    currentStep === SEND_FLOW_STEP.ADD_NEW_CONTACT ||
    currentStep === SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT;
  const isSelectingContactAddress = isRecipientStep && selectedContact !== undefined;
  const showRecipientInput =
    (currentStepConfig?.addressInput ?? false) && !isSelectingContactAddress;
  const recipientSupportsMemo = sendFeatures.hasMemoForRecipient(
    state.account.currency ?? undefined,
    recipientSearch.value,
  );
  const showMemoControls = Boolean(
    showRecipientInput &&
    recipientSupportsMemo &&
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

  const titleKey = resolveContactFlowTitleKey({
    isContactAddressFlowStep,
    isAddressPhase: Boolean(addNewContactHeader.onAddressPhaseBack),
    addressPhaseTitleKey: addNewContactHeader.titleKey,
    stepTitleKey: currentStepConfig?.titleKey,
  });
  const showAvailable = currentStepConfig?.showAvailable ?? true;

  const title = resolveHeaderTitle({
    isSelectingContactAddress,
    showTitle,
    titleKey,
    currencyName,
    memoLabel,
  });

  const descriptionText = resolveHeaderDescription({
    isSelectingContactAddress,
    selectedContactName: selectedContact?.name,
    showTitle,
    showAvailable,
    accountSummary,
  });

  const handleBack = useCallback(() => {
    closeScanner();

    if (isSelectingContactAddress) {
      track("button_clicked", {
        button: "back",
        page: "select contact address",
        ...trackingProperties,
      });
      clearSelectedContact();
      return;
    }

    if (isContactAddressFlowStep && addNewContactHeader.onAddressPhaseBack) {
      addNewContactHeader.onAddressPhaseBack();
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
        return {
          ...tx,
          utxoStrategy: { ...tx.utxoStrategy, excludeUTXOs: [] },
        };
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
    addNewContactHeader,
    backTarget,
    clearSelectedContact,
    close,
    closeScanner,
    currentStep,
    isContactAddressFlowStep,
    isSelectingContactAddress,
    navigation,
    resetViewState,
    transaction,
    trackingProperties,
  ]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "close",
      page: getSendFlowTrackingPage(currentStep, isSelectingContactAddress),
      recipientType,
      ...trackingProperties,
    });
    close();
  }, [close, currentStep, isSelectingContactAddress, recipientType, trackingProperties]);

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
    if (!isScannerOpen) {
      track("button_clicked", {
        button: "scan qr code",
        page: "step recipient",
        ...trackingProperties,
      });
    }
    toggleScanner();
  }, [isScannerOpen, toggleScanner, trackingProperties]);

  const pastedInputRef = useRef(false);
  const handleRecipientPaste = useCallback(() => {
    pastedInputRef.current = true;
    setInputMethod("paste");
    track("button_clicked", {
      button: "paste",
      page: "step recipient",
      ...trackingProperties,
    });
  }, [setInputMethod, trackingProperties]);

  const handleRecipientInputChange = useCallback(
    (value: string) => {
      if (pastedInputRef.current) {
        pastedInputRef.current = false;
      } else {
        setInputMethod("manual");
      }
      recipientSearch.setValue(value);
      if (value.length > 0) closeScanner();
    },
    [closeScanner, recipientSearch, setInputMethod],
  );

  const handleScanPicked = useCallback(
    (code: string) => {
      const decoded = decodeURIScheme(code);
      setInputMethod("qr_code");
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
    [closeScanner, recipientSearch, setInputMethod, state.transaction.transaction, transaction],
  );

  const transactionError = state.transaction.status?.errors?.transaction;
  const transactionErrorName = transactionError?.name;

  const canSearchContacts =
    isContactsFeatureEnabled &&
    isEligibleAddressCurrency(eligibleAddressFamilies, state.account.currency ?? undefined);
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
    handleClose,
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleRecipientPaste,
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

function resolveContactFlowTitleKey({
  isContactAddressFlowStep,
  isAddressPhase,
  addressPhaseTitleKey,
  stepTitleKey,
}: Readonly<{
  isContactAddressFlowStep: boolean;
  isAddressPhase: boolean;
  addressPhaseTitleKey: string;
  stepTitleKey: string | undefined;
}>): string {
  if (isContactAddressFlowStep && isAddressPhase) {
    return addressPhaseTitleKey;
  }

  if (isContactAddressFlowStep) {
    return stepTitleKey ?? addressPhaseTitleKey;
  }

  return stepTitleKey ?? "newSendFlow.title";
}
