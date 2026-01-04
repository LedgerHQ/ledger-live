import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { RecipientAddressModalView } from "./RecipientAddressModalView";
import { useRecipientAddressModalViewModel } from "../hooks/useRecipientAddressModalViewModel";

type RecipientAddressModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
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
