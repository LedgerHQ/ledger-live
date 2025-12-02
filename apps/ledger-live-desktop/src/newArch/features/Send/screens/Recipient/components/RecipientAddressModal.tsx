import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  useTheme,
  AddressInput,
} from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import EmptyList from "./EmptyList";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { MyAccountsSection } from "./MyAccountsSection";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { LoadingState } from "./LoadingState";
import { InvalidAddressBanner } from "./InvalidAddressBanner";
import { ValidationBanner } from "./ValidationBanner";
import { useAddressValidation } from "../../../hooks/useAddressValidation";
import { recentlyInteractedCache } from "../utils/recentlyInteractedCache";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { RecipientAddressModalProps, RecentAddress } from "../../../types";

export function RecipientAddressModal({
  isOpen,
  onClose,
  onBack,
  account,
  parentAccount,
  currency,
  availableBalance,
  onAddressSelected,
  selectedRecipient,
  onConfirmRecipient: _onConfirmRecipient,
}: RecipientAddressModalProps) {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const [searchValue, setSearchValue] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const mainAccount = getMainAccount(account, parentAccount);
  const accountCurrency = getAccountCurrency(account);
  const currencyName = accountCurrency.ticker;
  const isEthereum = accountCurrency.id === "ethereum";

  const { result, isLoading } = useAddressValidation({
    searchValue,
    currency,
    account,
    parentAccount,
    currentAccountId: mainAccount.id,
  });

  const recentAddresses = useMemo(() => {
    void refreshKey;
    return recentlyInteractedCache.getAddresses(currency);
  }, [currency, refreshKey]);

  const allAccounts = useSelector(accountsSelector);
  const userAccountsForCurrency = useMemo(() => {
    return allAccounts.filter(acc => {
      if (acc.id === mainAccount.id) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, mainAccount.id]);

  const hasSearchValue = searchValue.length > 0;
  const showInitialState = !hasSearchValue && !selectedRecipient;

  const hasRecentAddresses = recentAddresses.length > 0;
  const hasUserAccounts = userAccountsForCurrency.length > 0;
  const showInitialEmptyState = showInitialState && !hasRecentAddresses && !hasUserAccounts;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

  const handleRecentAddressSelect = useCallback(
    (address: RecentAddress) => {
      onAddressSelected(address.address, address.ensName);
    },
    [onAddressSelected],
  );

  const handleAccountSelect = useCallback(
    (selectedAccount: Account) => {
      onAddressSelected(selectedAccount.freshAddress);
    },
    [onAddressSelected],
  );

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      onAddressSelected(address, ensName);
    },
    [onAddressSelected],
  );

  const handleRemoveAddress = useCallback(
    (address: RecentAddress) => {
      recentlyInteractedCache.removeAddress(currency, address);
      setRefreshKey(prev => prev + 1);
    },
    [currency],
  );

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  }, [onBack, onClose]);

  const showSearchResults = hasSearchValue && !isLoading && !selectedRecipient;
  const isSanctioned = result.status === "sanctioned";

  // Check if address is complete based on validation status
  const isAddressComplete = useMemo(() => {
    return (
      result.status === "valid" ||
      result.status === "ens_resolved" ||
      result.status === "sanctioned"
    );
  }, [result.status]);

  const hasAnyMatches =
    (result.matchedAccounts && result.matchedAccounts.length > 0) ||
    result.matchedRecentAddress ||
    result.ensName ||
    result.isLedgerAccount ||
    isSanctioned;

  const showMatchedAddress =
    showSearchResults &&
    hasAnyMatches &&
    (result.status === "valid" ||
      (isEthereum && result.status === "ens_resolved") ||
      result.isLedgerAccount ||
      result.matchedRecentAddress ||
      isSanctioned);

  const showSanctionedBanner = isSanctioned && hasSearchValue;

  // Don't show invalid address error if we have matches (accounts, recent addresses, etc.)
  const showInvalidBanner =
    showSearchResults &&
    result.error &&
    !showSanctionedBanner &&
    result.status !== "valid" &&
    !hasAnyMatches;

  // Bridge validation errors and warnings
  const bridgeRecipientError = result.bridgeErrors?.recipient;
  const bridgeRecipientWarning = result.bridgeWarnings?.recipient;
  const bridgeSenderError = result.bridgeErrors?.sender;

  // Show bridge banners only when we have a valid search and not showing other errors
  // Don't show recipient errors if we have matches (user might be searching by name)
  const showBridgeRecipientError =
    showSearchResults &&
    bridgeRecipientError &&
    !showSanctionedBanner &&
    !showInvalidBanner &&
    !hasAnyMatches;
  const showBridgeRecipientWarning =
    showSearchResults && bridgeRecipientWarning && !showBridgeRecipientError;
  const showBridgeSenderError = showSearchResults && bridgeSenderError;

  const showEmptyState =
    showSearchResults &&
    (!isAddressComplete || !hasAnyMatches) &&
    !showMatchedAddress &&
    !showSanctionedBanner &&
    !showInvalidBanner &&
    !showBridgeRecipientError;

  const renderSelectedRecipientWIP = () => {
    if (!selectedRecipient) return null;

    return (
      <div className="flex flex-col gap-16 p-16">
        <div className="body-2 text-base">
          <p>Recipient selected:</p>
          <p className="body-3 text-muted mt-4">{selectedRecipient.address}</p>
          {selectedRecipient.ensName && (
            <p className="body-3 text-muted mt-2">ENS: {selectedRecipient.ensName}</p>
          )}
        </div>
      </div>
    );
  };

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={`w-[400px] h-[612px] flex flex-col ${mode} px-0`}
        data-testid="recipient-address-modal-content"
        style={{
          color: "var(--color-text-base)",
        }}
      >
        <div className="px-24">
          <DialogHeader
            appearance="compact"
            title={t("newSendFlow.title", { currency: currencyName })}
            description={t("newSendFlow.available", { amount: availableBalance })}
            onBack={handleBack}
            onClose={onClose}
          />
        </div>

        {/* Content Layout */}
        {selectedRecipient ? (
          <>{renderSelectedRecipientWIP()}</>
        ) : (
          <>
            {/* Fixed Address Input Section */}
            <AddressInput
              value={searchValue}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              placeholder={
                isEthereum ? t("newSendFlow.placeholder") : t("newSendFlow.placeholderNoENS")
              }
              className="w-full px-24"
            />

            {/* Scrollable Results & Sections */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent mt-24">
              {isLoading && <LoadingState />}

              {/* Initial State: Recent & My Accounts */}
              {showInitialState && (
                <>
                  <RecentAddressesSection
                    recentAddresses={recentAddresses}
                    onSelect={handleRecentAddressSelect}
                    onRemove={handleRemoveAddress}
                  />
                  <MyAccountsSection
                    currency={currency}
                    currentAccountId={mainAccount.id}
                    onSelect={handleAccountSelect}
                  />
                </>
              )}

              {/* Search Results State */}
              {showMatchedAddress && (
                <AddressMatchedSection
                  searchResult={result}
                  searchValue={searchValue}
                  onSelect={handleAddressSelect}
                  isSanctioned={isSanctioned}
                  isAddressComplete={isAddressComplete}
                />
              )}

              {/* Error/Warning Banners */}
              <div className="flex flex-col gap-16 pt-16 px-24">
                {showBridgeSenderError && (
                  <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
                )}
                {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
                {showInvalidBanner && <InvalidAddressBanner error={result.error} />}
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
                {(showEmptyState || showInitialEmptyState) && (
                  <EmptyList translationKey="newSendFlow.recentSendWillAppear" />
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
