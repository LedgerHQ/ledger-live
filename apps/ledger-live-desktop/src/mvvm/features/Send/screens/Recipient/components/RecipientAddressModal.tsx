import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import React from "react";
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
  const {
    handleRecentAddressSelect,
    handleAccountSelect,
    handleAddressSelect,
    handleRemoveAddress,
    ...viewModel
  } = useRecipientAddressModalViewModel({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  return (
    <RecipientAddressModalView
      {...viewModel}
      currency={currency}
      onRecentAddressSelect={handleRecentAddressSelect}
      onAccountSelect={handleAccountSelect}
      onAddressSelect={handleAddressSelect}
      onRemoveAddress={handleRemoveAddress}
    />
  );
}
