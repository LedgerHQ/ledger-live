import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { screen } from "~/analytics";
import { ScreenName } from "~/const";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
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
  onAddressSelected: (address: string, ensName?: string) => void;
  onMemoProceed: () => void;
}>;

export type RecipientScreenViewModel = RecipientScreenViewModelBase | ReadyRecipientScreenViewModel;

export function useRecipientScreenViewModel(): RecipientScreenViewModel {
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("mobile");

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? null;
  const currency = useMemo(
    () => state.account.currency ?? (account ? getAccountCurrency(account) : null),
    [state.account.currency, account],
  );
  const trackingProperties = useMemo(() => {
    const contactsOnNetwork =
      isContactsFeatureEnabled &&
      isEligibleAddressCurrency(eligibleAddressFamilies, currency ?? undefined)
        ? filterContactsByNetwork(contacts, currency?.id ?? "")
        : [];

    return {
      ...getSendFlowTrackingProperties(account, parentAccount),
      hasContacts: contactsOnNetwork.length > 0,
      contactsCount: contactsOnNetwork.length,
    };
  }, [
    account,
    contacts,
    currency,
    eligibleAddressFamilies,
    isContactsFeatureEnabled,
    parentAccount,
  ]);

  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || !account || !currency) {
      return;
    }
    hasTrackedRef.current = true;
    void screen("Modal send - step recipient", undefined, trackingProperties);
  }, [account, currency, trackingProperties]);

  const onMemoProceed = useCallback(() => {
    recipientSearch.clear();
    navigation.navigate(ScreenName.SendFlowAmount);
  }, [recipientSearch, navigation]);

  const onAddressSelected = useCallback(
    (address: string, ensName?: string) => {
      transaction.setRecipient({ address, ensName, memo: state.recipient?.memo });
      recipientSearch.clear();
      navigation.navigate(ScreenName.SendFlowAmount);
    },
    [transaction, state.recipient?.memo, recipientSearch, navigation],
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
    onMemoProceed,
  };
}
