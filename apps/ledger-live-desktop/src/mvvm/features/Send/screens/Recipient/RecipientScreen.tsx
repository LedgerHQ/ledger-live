import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import React, { useCallback, useMemo, useRef } from "react";
import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../utils/tracking";
import { RecipientAddressModal } from "./components/RecipientAddressModal";

export function RecipientScreen() {
  const { state, uiConfig } = useSendFlowData();
  const { transaction, close } = useSendFlowActions();
  const { navigation } = useFlowWizard();

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? undefined;

  const currency: CryptoCurrency | TokenCurrency | null = useMemo(() => {
    if (state.account.currency) return state.account.currency;
    return account ? getAccountCurrency(account) : null;
  }, [state.account.currency, account]);

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, state.account.parentAccount),
    [account, state.account.parentAccount],
  );

  const hasTrackedRef = useRef(false);
  if (!hasTrackedRef.current && account && currency) {
    hasTrackedRef.current = true;
    trackPage("Modal send - step recipient", null, trackingProperties);
  }

  const handleAddressSelected = useCallback(
    (address: string, ensName?: string, goToNextStep?: boolean) => {
      transaction.setRecipient({
        ...state.recipient,
        address,
        ensName,
      });

      if (goToNextStep) {
        navigation.goToNextStep();
      }
    },
    [transaction, state.recipient, navigation],
  );

  if (!account || !currency) {
    return null;
  }

  return (
    <RecipientAddressModal
      isOpen
      onClose={close}
      account={account}
      parentAccount={parentAccount}
      currency={currency}
      onAddressSelected={handleAddressSelected}
      recipientSupportsDomain={uiConfig.recipientSupportsDomain}
    />
  );
}
