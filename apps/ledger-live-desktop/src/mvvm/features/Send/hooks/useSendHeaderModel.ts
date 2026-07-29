import { SendFlowStep, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { t } from "i18next";
import { useMemo, useCallback, useRef } from "react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";
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
  showBackButton: boolean;
  showRecipientInput: boolean;
  showMemoControls: boolean;
  title: string | undefined;
  transactionErrorName: string | undefined;
  transactionError: Error | undefined;
}>;

export function useSendHeaderModel({
  availableText,
  resetViewState,
}: UseSendHeaderModelParams): UseSendHeaderModelResult {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch, isRecipientAddressComplete } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { isScannerOpen, closeScanner, toggleScanner } = useRecipientScanner();

  const currencyName = state.account.currency?.ticker ?? "";
  const accountName = useMaybeAccountName(state.account.account ?? undefined);

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig;
  const showRecipientInput = currentStepConfig?.addressInput ?? false;
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

  const showBackButton = navigation.canGoBack();

  const showTitle = currentStepConfig?.showTitle !== false;
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const accountSummary = useMemo(() => {
    if (accountName && availableText) return `${accountName} · ${availableText}`;
    return accountName || availableText || "";
  }, [accountName, availableText]);

  const titleKey = currentStepConfig?.titleKey ?? "newSendFlow.title";
  const showAvailable = currentStepConfig?.showAvailable ?? true;

  const title = showTitle ? t(titleKey, { currency: currencyName }) : "";

  const descriptionText = showTitle && showAvailable && accountSummary ? accountSummary : "";

  const handleBack = useCallback(() => {
    closeScanner();

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
  }, [backTarget, close, closeScanner, currentStep, navigation, resetViewState, transaction]);

  const addressInputValue = useMemo(() => {
    if (isRecipientStep) return recipientSearch.value;
    if (isAmountStep) return getRecipientDisplayValue(state.recipient);
    return recipientSearch.value;
  }, [isRecipientStep, isAmountStep, recipientSearch.value, state.recipient]);

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
      const { address } = decodeURIScheme(code);
      recipientSearch.setValue(address);
      closeScanner();
    },
    [closeScanner, recipientSearch],
  );

  const transactionError = state.transaction.status?.errors?.transaction;
  const transactionErrorName = transactionError?.name;

  return {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen: showScanner,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError: transactionError instanceof Error ? transactionError : undefined,
  };
}
