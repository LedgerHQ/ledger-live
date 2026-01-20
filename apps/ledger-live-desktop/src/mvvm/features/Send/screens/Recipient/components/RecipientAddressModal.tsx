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
      data={{
        searchValue: viewModel.searchValue,
        isLoading: viewModel.isLoading,
        result: viewModel.result,
        recentAddresses: viewModel.recentAddresses,
        mainAccount: viewModel.mainAccount,
        currency,
      }}
      ui={{
        showInitialState: viewModel.showInitialState,
        showInitialEmptyState: viewModel.showInitialEmptyState,
        showMatchedAddress: viewModel.showMatchedAddress,
        showAddressValidationError: viewModel.showAddressValidationError,
        showEmptyState: viewModel.showEmptyState,
        showBridgeSenderError: viewModel.showBridgeSenderError,
        showSanctionedBanner: viewModel.showSanctionedBanner,
        showBridgeRecipientError: viewModel.showBridgeRecipientError,
        showBridgeRecipientWarning: viewModel.showBridgeRecipientWarning,
        isSanctioned: viewModel.isSanctioned,
        isAddressComplete: viewModel.isAddressComplete,
        addressValidationErrorType: viewModel.addressValidationErrorType,
        bridgeRecipientError: viewModel.bridgeRecipientError,
        bridgeRecipientWarning: viewModel.bridgeRecipientWarning,
        bridgeSenderError: viewModel.bridgeSenderError,
        hasMemo: viewModel.hasMemo,
        hasMemoValidationError: viewModel.hasMemoValidationError,
        hasFilledMemo: viewModel.hasFilledMemo,
      }}
      actions={{
        onRecentAddressSelect: handleRecentAddressSelect,
        onAccountSelect: handleAccountSelect,
        onAddressSelect: handleAddressSelect,
        onRemoveAddress: handleRemoveAddress,
      }}
    />
  );
}
