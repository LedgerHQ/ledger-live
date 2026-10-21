import { trackPage } from "@shared/analytics";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { resolveCurrencyConfig } from "@ledgerhq/live-common/flows/send/utils/resolveCurrencyConfig";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  isEligibleAddressCurrency,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScreenName } from "~/const";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { useTranslation } from "~/context/Locale";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { getAccountSelfTransferTarget } from "../../../utils/selfTransferTarget";
import type { SendFlowNavigationProp } from "../../../types";

type RecipientScreenViewModelBase = Readonly<{
  ready: false;
}>;

export type ReadyRecipientScreenViewModel = Readonly<{
  ready: true;
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction | null;
  currency: CryptoOrTokenCurrency;
  recipientSupportsDomain: boolean;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
}>;

export type RecipientScreenViewModel = RecipientScreenViewModelBase | ReadyRecipientScreenViewModel;

export function useRecipientScreenViewModel(): RecipientScreenViewModel {
  const { t } = useTranslation();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const contacts = useContacts();
  const {
    isEnabled: isContactsFeatureEnabled,
    eligibleAddressFamilies,
    excludedCurrencyIds,
  } = useContactsFeature("mobile");

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? null;
  const currency = useMemo(
    () => state.account.currency ?? (account ? getAccountCurrency(account) : null),
    [state.account.currency, account],
  );
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const config = useMemo(() => resolveCurrencyConfig(currency?.id), [currency]);
  const trackingProperties = useMemo(() => {
    const contactsOnNetwork =
      isContactsFeatureEnabled &&
      isEligibleAddressCurrency(
        eligibleAddressFamilies,
        currency ?? undefined,
        excludedCurrencyIds,
        config,
      )
        ? filterContactsByNetwork(contacts, currency?.id ?? "")
        : [];

    return {
      ...sendFlowTrackingProperties,
      hasContacts: contactsOnNetwork.length > 0,
      contactsCount: contactsOnNetwork.length,
    };
  }, [
    sendFlowTrackingProperties,
    contacts,
    currency,
    config,
    eligibleAddressFamilies,
    excludedCurrencyIds,
    isContactsFeatureEnabled,
  ]);

  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || !account || !currency) {
      return;
    }
    hasTrackedRef.current = true;
    void trackPage({ category: "Modal send - step recipient", props: trackingProperties });
  }, [account, currency, trackingProperties]);

  const goToAmount = useCallback(() => {
    const { routes, index } = navigation.getState();
    if (routes[index - 1]?.name === ScreenName.SendFlowAmount) {
      navigation.goBack();
      return;
    }
    navigation.navigate(ScreenName.SendFlowAmount);
  }, [navigation]);

  const onAddressSelected = useCallback(
    (address: string, ensName?: string, goToNextStep = true, memo?: Memo) => {
      const selfTransferTarget = account
        ? getAccountSelfTransferTarget(account, state.transaction.transaction)
        : null;
      const matchedSelfTransferTarget =
        selfTransferTarget?.address.toLowerCase() === address.toLowerCase()
          ? selfTransferTarget
          : null;

      transaction.setRecipient({
        address,
        ensName,
        memo: memo ?? (state.recipient?.address === address ? state.recipient.memo : undefined),
        displayLabel: matchedSelfTransferTarget
          ? t(`send.newSendFlow.${matchedSelfTransferTarget.translationKey}.label`)
          : undefined,
        isSelfTransfer: matchedSelfTransferTarget !== null,
      });

      if (goToNextStep) {
        recipientSearch.clear();
        goToAmount();
      }
    },
    [
      account,
      state.transaction.transaction,
      transaction,
      state.recipient,
      t,
      recipientSearch,
      goToAmount,
    ],
  );

  if (!account || !currency) {
    return { ready: false };
  }

  return {
    ready: true,
    account,
    parentAccount,
    transaction: state.transaction.transaction,
    currency,
    recipientSupportsDomain: uiConfig.recipientSupportsDomain,
    onAddressSelected,
  };
}
