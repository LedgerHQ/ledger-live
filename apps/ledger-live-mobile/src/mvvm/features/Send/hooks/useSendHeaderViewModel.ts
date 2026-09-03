import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import { useMaybeAccountName } from "~/reducers/wallet";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { track } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import {
  buildTransactionPatchFromURIScheme,
  type DecodedURISchemePayment,
} from "@ledgerhq/live-common/flows/send/utils/uriScheme";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { useAvailableBalance } from "./useAvailableBalance";
import { useCurrentSendFlowStep } from "./useCurrentSendFlowStep";
import {
  getRecipientSearchPrefillValue,
  SEND_ADDRESS_FORMAT_OPTIONS,
} from "@ledgerhq/live-common/flows/send/utils";
import { getRecipientHeaderPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import type { RecipientHeaderContact } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useContactsFeature } from "@features/platform-contacts";
import { selectContacts } from "@domain/entity-contact";
import { useSelector } from "~/context/hooks";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { SendFlowNavigationProp } from "../types";
import { useRecipientContactSelection } from "../context/RecipientContactSelectionContext";
import { useSendFlowTracking } from "../context/SendFlowTrackingContext";
import { getSendFlowTrackingPage } from "../utils/contactTracking";

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
  recipientContact: RecipientHeaderContact | undefined;
  recipientPlaceholder: string;
  handleBackPress: () => void;
  handleClose: () => void;
  handleRecipientInputPress: () => void;
  setRecipientSearchValue: (value: string) => void;
  clearRecipientSearch: () => void;
  handleQrCodeClick: () => void;
  handleRecipientInputChange: (value: string) => void;
};

function getRecipientPlaceholderKey({
  supportsDomain,
  canSearchContacts,
}: Readonly<{ supportsDomain: boolean; canSearchContacts: boolean }>): string {
  if (canSearchContacts) {
    return supportsDomain
      ? "send.newSendFlow.placeholderWithContacts"
      : "send.newSendFlow.placeholderNoEnsWithContacts";
  }
  return supportsDomain ? "send.newSendFlow.placeholder" : "send.newSendFlow.placeholderNoENS";
}

export function useSendHeaderViewModel(): SendHeaderViewModel {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { t } = useTranslation();
  const { uiConfig, recipientSearch, state } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();
  const { displayMode } = useSendAmountDisplayMode();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("mobile");
  const contacts = useSelector(selectContacts);
  const { selectedContact, clearSelectedContact } = useRecipientContactSelection();
  const { recipientType, setInputMethod } = useSendFlowTracking();

  const accountName = useMaybeAccountName(state.account.account);
  const [currentStep, currentStepConfig] = useCurrentSendFlowStep();
  const headerDisplayMode = currentStep === SEND_FLOW_STEP.COIN_CONTROL ? "crypto" : displayMode;
  const spendableBalanceText = useAvailableBalance(state.account.account, headerDisplayMode);

  const currencyName = state.account.currency?.ticker ?? "";
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const isSelectingContactAddress = isRecipientStep && selectedContact !== undefined;
  const showTitle = currentStepConfig?.showTitle !== false;
  const isCustomFeesStep = currentStep === SEND_FLOW_STEP.CUSTOM_FEES;
  const isCoinControlStep = currentStep === SEND_FLOW_STEP.COIN_CONTROL;
  let title = "";
  if (isSelectingContactAddress) {
    title = t("send.newSendFlow.selectAddress");
  } else if (showTitle) {
    if (isCustomFeesStep) {
      title = t("send.newSendFlow.customFees.title");
    } else if (isCoinControlStep) {
      title = t("send.newSendFlow.coinControl.title");
    } else {
      title = t("send.newSendFlow.title", { currency: currencyName });
    }
  }
  const descriptionText = isSelectingContactAddress
    ? selectedContact.name
    : showTitle && !isCustomFeesStep
      ? [accountName, spendableBalanceText].filter(Boolean).join(" · ")
      : "";

  const showHeaderRight =
    !isSelectingContactAddress && currentStepConfig?.showHeaderRight !== false;
  const canGoBack =
    isSelectingContactAddress || Boolean(currentStepConfig?.canGoBack && navigation.canGoBack());
  const showRecipientInput = Boolean(currentStepConfig?.addressInput) && !isSelectingContactAddress;
  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  useEffect(() => {
    if (!isSelectingContactAddress) {
      return;
    }

    return navigation.addListener("beforeRemove", event => {
      event.preventDefault();
      track("button_clicked", {
        button: "back",
        page: "select contact address",
        ...trackingProperties,
      });
      clearSelectedContact();
    });
  }, [clearSelectedContact, isSelectingContactAddress, navigation, trackingProperties]);

  const recipientFromTransaction = useMemo(() => {
    const address = state.transaction.transaction?.recipient;
    if (!address || typeof address !== "string") return null;
    return { address } as const;
  }, [state.transaction.transaction?.recipient]);

  const recipientHeader = useMemo(
    () =>
      getRecipientHeaderPresentation({
        recipient: recipientFromTransaction,
        contacts,
        currencyId: state.account.currency?.id,
        isContactsFeatureEnabled: isContactsFeatureEnabled && isAmountStep,
      }),
    [
      contacts,
      isAmountStep,
      isContactsFeatureEnabled,
      recipientFromTransaction,
      state.account.currency?.id,
    ],
  );

  const formattedAddress = useMemo(() => {
    if (isRecipientStep) {
      return formatAddress(recipientSearch.value, SEND_ADDRESS_FORMAT_OPTIONS);
    }
    if (isAmountStep) {
      return recipientHeader.label;
    }
    return "";
  }, [isRecipientStep, isAmountStep, recipientHeader.label, recipientSearch.value]);

  const handleBackPress = useCallback(() => {
    if (isSelectingContactAddress) {
      track("button_clicked", {
        button: "back",
        page: "select contact address",
        ...trackingProperties,
      });
      clearSelectedContact();
      return;
    }

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
  }, [
    canGoBack,
    clearSelectedContact,
    close,
    currentStep,
    isSelectingContactAddress,
    navigation,
    trackingProperties,
    transaction,
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

  const handleRecipientInputPress = useCallback(() => {
    if (!isAmountStep) return;

    const prefillValue = getRecipientSearchPrefillValue(recipientFromTransaction);
    if (prefillValue) {
      setRecipientSearchValue(prefillValue);
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ScreenName.SendFlowRecipient);
    }
  }, [isAmountStep, navigation, recipientFromTransaction, setRecipientSearchValue]);

  const handleScannedURI = useCallback(
    (decoded: DecodedURISchemePayment) => {
      setInputMethod("qr_code");
      setRecipientSearchValue(decoded.address);

      const currentTransaction = state.transaction.transaction;
      if (currentTransaction) {
        const patch = buildTransactionPatchFromURIScheme(currentTransaction, decoded);
        if (Object.keys(patch).length > 0) {
          transaction.updateTransaction(tx => ({ ...tx, ...patch }) as typeof tx);
        }
      }
    },
    [setInputMethod, setRecipientSearchValue, state.transaction.transaction, transaction],
  );

  const handleQrCodeClick = useCallback(() => {
    if (!state.account.account) return;

    track("button_clicked", {
      button: "scan qr code",
      page: "step recipient",
      ...trackingProperties,
    });
    clearRecipientSearch();
    navigation.navigate(ScreenName.ScanRecipient, {
      accountId: state.account.account.id,
      parentId: state.account.parentAccount?.id,
      transaction: state.transaction.transaction ?? undefined,
      onScannedURI: handleScannedURI,
    });
  }, [
    clearRecipientSearch,
    handleScannedURI,
    navigation,
    state.account.account,
    state.account.parentAccount?.id,
    state.transaction.transaction,
    trackingProperties,
  ]);

  const handleRecipientInputChange = useCallback(
    (value: string) => {
      const addedLength = value.length - recipientSearch.value.length;
      setInputMethod(addedLength > 1 ? "paste" : "manual");
      recipientSearch.setValue(value);
    },
    [recipientSearch, setInputMethod],
  );

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
    recipientContact: recipientHeader.contact,
    recipientPlaceholder,
    handleBackPress,
    handleClose,
    handleRecipientInputPress,
    setRecipientSearchValue,
    clearRecipientSearch,
    handleQrCodeClick,
    handleRecipientInputChange,
  };
}
