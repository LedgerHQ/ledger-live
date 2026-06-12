import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import React, { useCallback, useMemo } from "react";
import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { useRecipientView } from "../../context/RecipientViewContext";
import { RecipientAddressModal } from "./components/RecipientAddressModal";
import { RecipientAccountsList } from "./components/RecipientAccountsList";
import { RecipientContactsList } from "./components/RecipientContactsList";

export function RecipientScreen() {
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction, close } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const { view, setView } = useRecipientView();

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? undefined;

  const currency: CryptoCurrency | TokenCurrency | null = useMemo(() => {
    if (state.account.currency) return state.account.currency;
    return account ? getAccountCurrency(account) : null;
  }, [state.account.currency, account]);

  const recipientChainId =
    currency?.type === "CryptoCurrency"
      ? currency.ethereumLikeInfo?.chainId
      : currency?.type === "TokenCurrency"
        ? currency.parentCurrency.ethereumLikeInfo?.chainId
        : undefined;

  // Full-list row click: picking a contact / own account is an explicit
  // choice — fold back to the default view, commit the recipient, and
  // jump straight to the Amount step. The search input stays clear so
  // going back from Amount lands on the clean selection state, not the
  // matched-address verification. Memo currencies are the exception:
  // their inline memo controls live on the Recipient step, so there we
  // only fill the input.
  const handlePickAddress = useCallback(
    (address: string) => {
      setView("default");
      if (uiConfig.hasMemo) {
        recipientSearch.setValue(address);
        return;
      }
      recipientSearch.clear();
      transaction.setRecipient({ ...state.recipient, address });
      navigation.goToNextStep();
    },
    [recipientSearch, setView, uiConfig.hasMemo, transaction, state.recipient, navigation],
  );

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

  if (view === "contacts") {
    return (
      <RecipientContactsList
        chainId={recipientChainId}
        selectedTicker={currency.ticker}
        onSelect={s => handlePickAddress(s.addressHex)}
      />
    );
  }

  if (view === "accounts") {
    return (
      <RecipientAccountsList
        currency={currency}
        currentMainAccountId={getMainAccount(account, parentAccount).id}
        chainId={recipientChainId}
        onSelect={s => handlePickAddress(s.address)}
      />
    );
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
