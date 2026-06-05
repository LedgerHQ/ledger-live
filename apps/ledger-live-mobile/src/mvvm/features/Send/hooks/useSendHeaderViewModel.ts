import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";

import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { useAvailableBalance } from "./useAvailableBalance";
import { useCurrentSendFlowStep } from "./useCurrentSendFlowStep";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";

export type SendHeaderViewModel = {
  title: string;
  descriptionText: string;
  showTitle: boolean;
  showHeaderRight: boolean;
  canGoBack: boolean;
  isRecipientStep: boolean;
  isAmountStep: boolean;
  showRecipientInput: boolean;
  recipientSearch: {
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  };
  formattedAddress: string;
  recipientPlaceholder: string;
  handleBackPress: () => void;
  handleClose: () => void;
  handleRecipientInputPress: () => void;
  setRecipientSearchValue: (value: string) => void;
  clearRecipientSearch: () => void;
  handleQrCodeClick: () => void;
};

export function useSendHeaderViewModel(): SendHeaderViewModel {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { uiConfig, recipientSearch, state } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();

  const availableText = useAvailableBalance(state.account.account);
  const [currentStep, currentStepConfig] = useCurrentSendFlowStep();

  const currencyName = state.account.currency?.ticker ?? "";
  const showTitle = currentStepConfig?.showTitle !== false;
  const title = showTitle ? t("send.newSendFlow.title", { currency: currencyName }) : "";
  const descriptionText =
    showTitle && availableText ? t("send.newSendFlow.available", { amount: availableText }) : "";

  const showHeaderRight = currentStepConfig?.showHeaderRight !== false;
  const canGoBack = Boolean(currentStepConfig?.canGoBack && navigation.canGoBack());
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const showRecipientInput = Boolean(currentStepConfig?.addressInput);

  const recipientFromTransaction = useMemo(() => {
    const address = state.transaction.transaction?.recipient;
    if (!address || typeof address !== "string") return null;
    return { address } as const;
  }, [state.transaction.transaction?.recipient]);

  const formattedAddress = useMemo(() => {
    if (isRecipientStep) {
      return recipientSearch.value.length > 11
        ? `${recipientSearch.value.slice(0, 4)}...${recipientSearch.value.slice(-4)}`
        : recipientSearch.value;
    }
    if (isAmountStep) {
      return getRecipientDisplayValue(recipientFromTransaction, {
        prefixLength: 4,
        suffixLength: 4,
      });
    }
    return "";
  }, [isRecipientStep, isAmountStep, recipientSearch.value, recipientFromTransaction]);

  const handleBackPress = useCallback(() => {
    if (canGoBack) {
      if (currentStep === SEND_FLOW_STEP.AMOUNT) {
        transaction.updateTransaction(tx => ({
          ...tx,
          amount: new BigNumber(0),
          useAllAmount: false,
          feesStrategy: null,
        }));
      }
      navigation.goBack();
    } else {
      close();
    }
  }, [canGoBack, close, currentStep, navigation, transaction]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  const handleRecipientInputPress = useCallback(() => {
    if (!isAmountStep) return;

    const prefillValue = getRecipientSearchPrefillValue(recipientFromTransaction);
    if (prefillValue) {
      setRecipientSearchValue(prefillValue);
    }

    navigation.goBack();
  }, [isAmountStep, navigation, recipientFromTransaction, setRecipientSearchValue]);

  const handleQrCodeClick = useCallback(() => {
    // Implementation of QR code scanning on Recipient screen
  }, []);

  const recipientPlaceholder = uiConfig.recipientSupportsDomain
    ? t("send.newSendFlow.placeholder")
    : t("send.newSendFlow.placeholderNoENS");

  return {
    title,
    descriptionText,
    showTitle,
    showHeaderRight,
    canGoBack,
    isRecipientStep,
    isAmountStep,
    showRecipientInput,
    recipientSearch,
    formattedAddress,
    recipientPlaceholder,
    handleBackPress,
    handleClose,
    handleRecipientInputPress,
    setRecipientSearchValue,
    clearRecipientSearch,
    handleQrCodeClick,
  };
}
