import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientScanner } from "../../../context/RecipientScannerContext";
import { trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";

type RecipientScreenViewModelBase = Readonly<{
  ready: false;
}>;

export type ReadyRecipientScreenViewModel = Readonly<{
  ready: true;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoOrTokenCurrency;
  recipientSupportsDomain: boolean;
  onClose: () => void;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
}>;

export type RecipientScreenViewModel = RecipientScreenViewModelBase | ReadyRecipientScreenViewModel;

export function useRecipientScreenViewModel(): RecipientScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction, close } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const { isScannerOpen } = useRecipientScanner();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("desktop");

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? undefined;
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
      ...getSendFlowTrackingProperties(account, state.account.parentAccount),
      hasContacts: contactsOnNetwork.length > 0,
      contactsCount: contactsOnNetwork.length,
    };
  }, [
    account,
    contacts,
    currency,
    eligibleAddressFamilies,
    isContactsFeatureEnabled,
    state.account.parentAccount,
  ]);

  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || !account || !currency) {
      return;
    }
    hasTrackedRef.current = true;
    trackPage("Modal send - step recipient", null, trackingProperties);
  }, [account, currency, trackingProperties]);

  const onAddressSelected = useCallback(
    (address: string, ensName?: string, goToNextStep?: boolean, memo?: Memo) => {
      transaction.setRecipient({
        ...state.recipient,
        address,
        ensName,
        ...(memo ? { memo } : {}),
      });

      if (goToNextStep) {
        navigation.goToNextStep();
      }
    },
    [transaction, state.recipient, navigation],
  );

  if (!account || !currency || isScannerOpen) {
    return { ready: false };
  }

  return {
    ready: true,
    account,
    parentAccount,
    currency,
    recipientSupportsDomain: uiConfig.recipientSupportsDomain,
    onClose: close,
    onAddressSelected,
  };
}
