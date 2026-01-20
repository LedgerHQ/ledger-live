import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import EmptyList from "./EmptyList";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { MyAccountsSection } from "./MyAccountsSection";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { LoadingState } from "./LoadingState";
import { ValidationBanner } from "./ValidationBanner";
import { AddressValidationError } from "./AddressValidationError";
import type {
  AddressSearchResult,
  RecentAddress,
  AddressValidationError as AddressValidationErrorType,
} from "../types";

type RecipientAddressModalViewData = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  recentAddresses: RecentAddress[];
  mainAccount: Account;
  currency: CryptoOrTokenCurrency;
}>;

type RecipientAddressModalViewUi = Readonly<{
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
  hasMemo: boolean;
  hasMemoValidationError: boolean;
  hasFilledMemo: boolean;
}>;

type RecipientAddressModalViewActions = Readonly<{
  onRecentAddressSelect: (address: RecentAddress) => void;
  onAccountSelect: (account: Account) => void;
  onAddressSelect: (address: string, ensName?: string) => void;
  onRemoveAddress: (address: RecentAddress) => void;
}>;

type RecipientAddressModalViewProps = Readonly<{
  data: RecipientAddressModalViewData;
  ui: RecipientAddressModalViewUi;
  actions: RecipientAddressModalViewActions;
}>;

export function RecipientAddressModalView({ data, ui, actions }: RecipientAddressModalViewProps) {
  const { searchValue, isLoading, result, recentAddresses, mainAccount, currency } = data;
  const {
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
    hasMemo,
    hasMemoValidationError,
    hasFilledMemo,
  } = ui;

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
            onSelect={actions.onRecentAddressSelect}
            onRemove={actions.onRemoveAddress}
          />
          <MyAccountsSection
            currency={currency}
            currentAccountId={mainAccount.id}
            onSelect={actions.onAccountSelect}
          />
        </>
      )}

      {showMatchedAddress && (!hasMemo || (hasFilledMemo && !hasMemoValidationError)) && (
        <AddressMatchedSection
          searchResult={result}
          searchValue={searchValue}
          onSelect={actions.onAddressSelect}
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
