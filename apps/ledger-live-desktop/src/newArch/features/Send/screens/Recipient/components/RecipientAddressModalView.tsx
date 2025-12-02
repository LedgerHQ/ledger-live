import React from "react";
import { useTheme, AddressInput } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import EmptyList from "./EmptyList";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { MyAccountsSection } from "./MyAccountsSection";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { LoadingState } from "./LoadingState";
import { ValidationBanner } from "./ValidationBanner";
import type { AddressSearchResult, RecentAddress, AddressValidationError } from "../types";

type RecipientAddressModalViewProps = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  recentAddresses: RecentAddress[];
  mainAccount: Account;
  currency: CryptoCurrency | TokenCurrency;
  recipientSupportsDomain: boolean;
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
  addressValidationErrorType: AddressValidationError | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onRecentAddressSelect: (address: RecentAddress) => void;
  onAccountSelect: (account: Account) => void;
  onAddressSelect: (address: string, ensName?: string) => void;
  onRemoveAddress: (address: RecentAddress) => void;
}>;

export function RecipientAddressModalView({
  searchValue,
  isLoading,
  result,
  recentAddresses,
  mainAccount,
  currency,
  recipientSupportsDomain,
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
  onSearchChange,
  onClearSearch,
  onRecentAddressSelect,
  onAccountSelect,
  onAddressSelect,
  onRemoveAddress,
}: RecipientAddressModalViewProps) {
  const { t } = useTranslation();
  const { mode } = useTheme();

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${mode} text-base`}
      data-testid="recipient-address-modal-content"
    >
      <div className="flex flex-1 min-h-0 flex-col gap-24 pt-24">
        <div className="px-24">
          <AddressInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder={
              recipientSupportsDomain
                ? t("newSendFlow.placeholder")
                : t("newSendFlow.placeholderNoENS")
            }
            className="w-full"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-24 pb-24">
            {isLoading && (
              <div className="px-16">
                <LoadingState />
              </div>
            )}

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

            {showMatchedAddress && (
              <AddressMatchedSection
                searchResult={result}
                searchValue={searchValue}
                onSelect={onAddressSelect}
                isSanctioned={isSanctioned}
                isAddressComplete={isAddressComplete}
              />
            )}

            {showAddressValidationError && (
              <div className="px-24">
                <EmptyList error={addressValidationErrorType} />
              </div>
            )}

            {(showEmptyState || showInitialEmptyState) && (
              <div className="px-24">
                <EmptyList translationKey="newSendFlow.recentSendWillAppear" />
              </div>
            )}

            {(showBridgeSenderError ||
              showSanctionedBanner ||
              showBridgeRecipientError ||
              showBridgeRecipientWarning) && (
              <div className="flex flex-col gap-16 pt-16 px-24">
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
                  <ValidationBanner
                    type="warning"
                    warning={bridgeRecipientWarning}
                    variant="recipient"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
