import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import { useMaybeAccountName } from "~/reducers/wallet";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";

import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { useAvailableBalance } from "./useAvailableBalance";
import { useCurrentSendFlowStep } from "./useCurrentSendFlowStep";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
  SEND_ADDRESS_FORMAT_OPTIONS,
} from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { SendFlowNavigationProp } from "../types";

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
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { t } = useTranslation();
  const { uiConfig, recipientSearch, state } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();
  const { displayMode } = useSendAmountDisplayMode();

  const accountName = useMaybeAccountName(state.account.account);
  const [currentStep, currentStepConfig] = useCurrentSendFlowStep();
  const headerDisplayMode = currentStep === SEND_FLOW_STEP.COIN_CONTROL ? "crypto" : displayMode;
  const spendableBalanceText = useAvailableBalance(state.account.account, headerDisplayMode);

  const currencyName = state.account.currency?.ticker ?? "";
  const showTitle = currentStepConfig?.showTitle !== false;
  const isCustomFeesStep = currentStep === SEND_FLOW_STEP.CUSTOM_FEES;
  const isCoinControlStep = currentStep === SEND_FLOW_STEP.COIN_CONTROL;
  let title = "";
  if (showTitle) {
    if (isCustomFeesStep) {
      title = t("send.newSendFlow.customFees.title");
    } else if (isCoinControlStep) {
      title = t("send.newSendFlow.coinControl.title");
    } else {
      title = t("send.newSendFlow.title", { currency: currencyName });
    }
  }
  const descriptionText =
    showTitle && !isCustomFeesStep
      ? [accountName, spendableBalanceText].filter(Boolean).join(" · ")
      : "";

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
      return formatAddress(recipientSearch.value, SEND_ADDRESS_FORMAT_OPTIONS);
    }
    if (isAmountStep) {
      return getRecipientDisplayValue(recipientFromTransaction);
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
    const account = state.account.account;
    if (!account) return;

    clearRecipientSearch();
    navigation.navigate(ScreenName.ScanRecipient, {
      accountId: account.id,
      parentId: state.account.parentAccount?.id,
      transaction: state.transaction.transaction ?? undefined,
      onScanned: setRecipientSearchValue,
    });
  }, [
    clearRecipientSearch,
    navigation,
    setRecipientSearchValue,
    state.account.account,
    state.account.parentAccount?.id,
    state.transaction.transaction,
  ]);

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
