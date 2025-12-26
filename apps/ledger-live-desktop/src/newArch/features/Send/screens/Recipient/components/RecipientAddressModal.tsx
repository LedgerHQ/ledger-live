import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { RecipientAddressModalView } from "./RecipientAddressModalView";
import { useRecipientAddressModalViewModel } from "../hooks/useRecipientAddressModalViewModel";
import { Memo } from "../../../types";

type RecipientAddressModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, ensName?: string, goToNextStep?: boolean) => void;
  recipientSupportsDomain: boolean;
  onMemoChange: (memo: Memo) => void;
  onMemoSkip: () => void;
}>;

export function RecipientAddressModal({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain = false,
  onMemoChange,
  onMemoSkip,
}: RecipientAddressModalProps) {
  const viewModel = useRecipientAddressModalViewModel({
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
      recipientSupportsDomain={recipientSupportsDomain}
      onSearchChange={viewModel.handleSearchChange}
      onClearSearch={viewModel.handleClearSearch}
      onRecentAddressSelect={viewModel.handleRecentAddressSelect}
      onAccountSelect={viewModel.handleAccountSelect}
      onAddressSelect={viewModel.handleAddressSelect}
      onRemoveAddress={viewModel.handleRemoveAddress}
      onMemoChange={onMemoChange}
      onMemoSkip={onMemoSkip}
    />
  );
}
