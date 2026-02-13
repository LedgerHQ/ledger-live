import { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";

import { SEND_FLOW_CONFIG } from "../constants";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { useAvailableBalance } from "./useAvailableBalance";
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
  recipientSearchValue: string;
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
  const route = useRoute();
  const { t } = useTranslation();
  const { uiConfig, recipientSearchValue, state } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();

  const availableText = useAvailableBalance(state.account.account);

  const [currentStep, currentStepConfig] = useMemo<
    readonly [
      SendFlowStep | undefined,
      (typeof SEND_FLOW_CONFIG.stepConfigs)[SendFlowStep] | undefined,
    ]
  >(() => {
    const step = SEND_FLOW_CONFIG.stepOrder.find(
      step => SEND_FLOW_CONFIG.stepConfigs[step].screenName === route.name,
    );
    if (!step) return [undefined, undefined];
    return [step, SEND_FLOW_CONFIG.stepConfigs[step]];
  }, [route.name]);

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
      return recipientSearchValue.length > 11
        ? `${recipientSearchValue.slice(0, 4)}...${recipientSearchValue.slice(-4)}`
        : recipientSearchValue;
    }
    if (isAmountStep) {
      return getRecipientDisplayValue(recipientFromTransaction, {
        prefixLength: 4,
        suffixLength: 4,
      });
    }
    return "";
  }, [isRecipientStep, isAmountStep, recipientSearchValue, recipientFromTransaction]);

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
    recipientSearchValue,
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
