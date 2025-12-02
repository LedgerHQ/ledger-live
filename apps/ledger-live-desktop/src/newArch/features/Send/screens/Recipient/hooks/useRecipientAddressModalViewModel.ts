import { useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { RecentAddress } from "../types";
import { useAddressValidation } from "./useAddressValidation";

type UseRecipientAddressModalViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
  recipientSupportsDomain: boolean;
}>;

export function useRecipientAddressModalViewModel({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
}: UseRecipientAddressModalViewModelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const mainAccount = getMainAccount(account, parentAccount);

  const { result, isLoading } = useAddressValidation({
    searchValue,
    currency,
    account,
    parentAccount,
    currentAccountId: mainAccount.id,
  });

  const allAccounts = useSelector(accountsSelector);
  const userAccountsForCurrency = useMemo(() => {
    return allAccounts.filter(acc => {
      if (acc.id === mainAccount.id) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, mainAccount.id]);

  const recentAddresses = useMemo(() => {
    void refreshKey;
    const addressesWithMetadata = getRecentAddressesStore().getAddressesWithMetadata(currency.id);
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    return addressesWithMetadata
      .filter(entry => {
        if (!entry?.address) return false;
        if (
          selfTransferPolicy === "impossible" &&
          entry.address.toLowerCase() === mainAccount.freshAddress.toLowerCase()
        ) {
          return false;
        }
        return true;
      })
      .map(entry => {
        const matchedAccount = userAccountsByAddress.get(entry.address.toLowerCase());
        return {
          address: entry.address,
          currency,
          lastUsedAt: new Date(entry.lastUsed),
          name: entry.address,
          isLedgerAccount: !!matchedAccount,
          accountId: matchedAccount?.id,
        } as RecentAddress;
      });
  }, [currency, refreshKey, mainAccount.freshAddress, userAccountsForCurrency]);

  const hasSearchValue = searchValue.length > 0;
  const showInitialState = !hasSearchValue;

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
      getRecentAddressesStore().removeAddress(currency.id, address.address);
      setRefreshKey(prev => prev + 1);
    },
    [currency],
  );

  const showSearchResults = hasSearchValue && !isLoading;
  const isSanctioned = result.status === "sanctioned";

  const isAddressComplete = useMemo(() => {
    return (
      result.status === "valid" ||
      result.status === "ens_resolved" ||
      result.status === "sanctioned"
    );
  }, [result.status]);

  const hasAnyMatches =
    (result.matchedAccounts && result.matchedAccounts.length > 0) ||
    !!result.matchedRecentAddress ||
    !!result.ensName ||
    result.isLedgerAccount ||
    isSanctioned;

  const showMatchedAddress =
    showSearchResults &&
    hasAnyMatches &&
    (result.status === "valid" ||
      (recipientSupportsDomain && result.status === "ens_resolved") ||
      result.isLedgerAccount ||
      !!result.matchedRecentAddress ||
      isSanctioned);

  const showSanctionedBanner = isSanctioned && hasSearchValue;

  const bridgeRecipientError = result.bridgeErrors?.recipient;
  const bridgeRecipientWarning = result.bridgeWarnings?.recipient;
  const bridgeSenderError = result.bridgeErrors?.sender;

  const isSelfTransferError =
    bridgeRecipientError instanceof InvalidAddressBecauseDestinationIsAlsoSource;
  const isBridgeInvalidAddress =
    bridgeRecipientError instanceof InvalidAddress && !isSelfTransferError;

  const showAddressValidationError =
    showSearchResults &&
    !showSanctionedBanner &&
    !hasAnyMatches &&
    (!!result.error || isBridgeInvalidAddress);

  const addressValidationErrorType =
    result.error ?? (isBridgeInvalidAddress ? "incorrect_format" : null);

  const showBridgeRecipientError =
    showSearchResults &&
    !!bridgeRecipientError &&
    !isBridgeInvalidAddress &&
    !showSanctionedBanner &&
    !hasAnyMatches;
  const showBridgeRecipientWarning =
    showSearchResults &&
    !!bridgeRecipientWarning &&
    !showBridgeRecipientError &&
    !showAddressValidationError;
  const showBridgeSenderError = showSearchResults && !!bridgeSenderError;

  const showEmptyState =
    showSearchResults &&
    (!isAddressComplete || !hasAnyMatches) &&
    !showMatchedAddress &&
    !showSanctionedBanner &&
    !showAddressValidationError &&
    !showBridgeRecipientError;

  return {
    searchValue,
    isLoading,
    result,
    recentAddresses,
    mainAccount,
    showInitialState,
    showInitialEmptyState,
    showSearchResults,
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
    handleSearchChange,
    handleClearSearch,
    handleRecentAddressSelect,
    handleAccountSelect,
    handleAddressSelect,
    handleRemoveAddress,
  };
}
