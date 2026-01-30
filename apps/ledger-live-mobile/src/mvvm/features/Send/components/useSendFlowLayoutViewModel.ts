import { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";

import { SEND_FLOW_CONFIG } from "../constants";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

export type SendFlowLayoutViewModel = {
  title: string;
  canGoBack: boolean;
  isRecipientStep: boolean;
  isAmountStep: boolean;
  showRecipientInput: boolean;
  recipientSearchValue: string;
  formattedAddress: string;
  recipientPlaceholder: string;
  handleBackPress: () => void;
  handleRecipientInputPress: () => void;
  setRecipientSearchValue: (value: string) => void;
  clearRecipientSearch: () => void;
  handleQrCodeClick: () => void;
};

export function useSendFlowLayoutViewModel(): SendFlowLayoutViewModel {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { uiConfig, recipientSearchValue, state } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();

  const currencyName = state.account.currency?.ticker ?? "";
  const title = t("send.newSendFlow.title", { currency: currencyName });

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

  const canGoBack = Boolean(currentStepConfig?.canGoBack && navigation.canGoBack());
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const showRecipientInput = Boolean(currentStepConfig?.addressInput);

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

  const formattedAddress = useMemo(
    () => formatAddress(recipientSearchValue),
    [recipientSearchValue],
  );

  const handleRecipientInputPress = useCallback(() => {
    if (!isAmountStep) return;
    navigation.goBack();
  }, [isAmountStep, navigation]);

  const handleQrCodeClick = useCallback(() => {
    // Implementation of QR code scanning on Recipient screen
  }, []);

  const recipientPlaceholder = uiConfig.recipientSupportsDomain
    ? t("send.newSendFlow.placeholder")
    : t("send.newSendFlow.placeholderNoENS");

  return {
    title,
    canGoBack,
    isRecipientStep,
    isAmountStep,
    showRecipientInput,
    recipientSearchValue,
    formattedAddress,
    recipientPlaceholder,
    handleBackPress,
    handleRecipientInputPress,
    setRecipientSearchValue,
    clearRecipientSearch,
    handleQrCodeClick,
  };
}
