import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import type {
  AddressSearchResult,
  AddressValidationError as AddressValidationErrorType,
  RecentAddress,
} from "../types";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import { MyAccountsSection } from "./MyAccountsSection";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { ValidationBanner } from "./ValidationBanner";

type RecipientAddressModalViewProps = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  recentAddresses: RecentAddress[];
  mainAccount: Account;
  currency: CryptoOrTokenCurrency;
  showInitialState: boolean;
  showInitialEmptyState: boolean;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  isSanctioned: boolean;
  isAddressComplete: boolean;
  addressValidationErrorType: AddressValidationErrorType | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  onRecentAddressSelect: (address: RecentAddress) => void;
  onAccountSelect: (account: Account) => void;
  onAddressSelect: (address: string, ensName?: string) => void;
  onRemoveAddress: (address: RecentAddress) => void;
  hasMemo: boolean;
  hasMemoValidationError: boolean;
  hasFilledMemo: boolean;
}>;

export function RecipientAddressModalView({
  searchValue,
  isLoading,
  result,
  recentAddresses,
  mainAccount,
  currency,
  showInitialState,
  showInitialEmptyState,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  isSanctioned,
  isAddressComplete,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  onRecentAddressSelect,
  onAccountSelect,
  onAddressSelect,
  onRemoveAddress,
  hasMemo,
  hasMemoValidationError,
  hasFilledMemo,
}: RecipientAddressModalViewProps) {
  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  return (
    <>
      {isLoading && <LoadingState />}

      {showInitialState && (
        <>
          <RecentAddressesSection
            recentAddresses={recentAddresses}
            onSelect={onRecentAddressSelect}
            onRemove={onRemoveAddress}
          />
          <MyAccountsSection
            currency={currency}
            currentAccountId={mainAccount.id}
            onSelect={onAccountSelect}
          />
        </>
      )}

      {showMatchedAddress && (!hasMemo || (hasFilledMemo && !hasMemoValidationError)) && (
        <AddressMatchedSection
          searchResult={result}
          searchValue={searchValue}
          onSelect={onAddressSelect}
          isSanctioned={isSanctioned}
          isAddressComplete={isAddressComplete}
          hasBridgeError={showBridgeRecipientError || showBridgeRecipientWarning}
        />
      )}

      {showAddressValidationError && <AddressValidationError error={addressValidationErrorType} />}

      {(showEmptyState || showInitialEmptyState) && (
        <EmptyList translationKey="newSendFlow.recentSendWillAppear" />
      )}

      {shouldShowErrorBanner && (
        <div className="mt-6 flex flex-col gap-16">
          {showBridgeSenderError && (
            <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
          )}
          {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
          {showBridgeRecipientError && (
            <ValidationBanner
              type="error"
              error={bridgeRecipientError}
              variant="recipient"
              excludeRecipientRequired
            />
          )}
          {showBridgeRecipientWarning && (
            <ValidationBanner type="warning" warning={bridgeRecipientWarning} variant="recipient" />
          )}
        </div>
      )}
    </>
  );
}
