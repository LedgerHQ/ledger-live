import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import React, { useEffect } from "react";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useRecipientAddressModalViewModel } from "../hooks/useRecipientAddressModalViewModel";
import { RecipientAddressModalView } from "./RecipientAddressModalView";

type RecipientAddressModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (address: string, ensName?: string, goToNextStep?: boolean) => void;
  recipientSupportsDomain: boolean;
}>;

export function RecipientAddressModal({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain = false,
}: RecipientAddressModalProps) {
  const { setIsRecipientAddressComplete } = useSendFlowActions();
  const { handleAddressSelect, ...viewModel } = useRecipientAddressModalViewModel({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  useEffect(() => {
    setIsRecipientAddressComplete(viewModel.isAddressComplete);
  }, [viewModel.isAddressComplete, setIsRecipientAddressComplete]);

  return <RecipientAddressModalView {...viewModel} onAddressSelect={handleAddressSelect} />;
}
