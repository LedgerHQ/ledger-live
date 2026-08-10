import { useMemo } from "react";
import type { AddressSearchResult } from "../types";

type UseRecipientSearchStateProps = {
  searchValue: string;
  result: AddressSearchResult;
  isLoading: boolean;
  recipientSupportsDomain: boolean;
};

export function useRecipientSearchState({
  searchValue,
  result,
  isLoading,
  recipientSupportsDomain,
}: UseRecipientSearchStateProps) {
  const hasSearchValue = searchValue.length > 0;
  const isSanctioned = result.status === "sanctioned";

  const bridgeRecipientError = result.bridgeErrors?.recipient;
  const bridgeRecipientWarning = result.bridgeWarnings?.recipient;
  const bridgeSenderError = result.bridgeErrors?.sender;

  const isSelfTransferError =
    bridgeRecipientError?.name === "InvalidAddressBecauseDestinationIsAlsoSource";
  const isBridgeInvalidAddress =
    bridgeRecipientError?.name === "InvalidAddress" && !isSelfTransferError;

  const hasValidatedAddress =
    result.status === "valid" || result.status === "ens_resolved" || result.status === "sanctioned";
  const hasValidAddress = result.status === "valid" || result.status === "ens_resolved";

  const showSearchResults = hasSearchValue && (!isLoading || hasValidatedAddress);

  // Local validation sets status "valid" before the bridge confirms the format.
  // Wait for the first bridge result for this recipient to avoid briefly treating
  // incomplete input as a selectable matching address.
  const isAddressComplete = useMemo(() => {
    return hasValidatedAddress && !isBridgeInvalidAddress && !result.isBridgeLoading;
  }, [hasValidatedAddress, isBridgeInvalidAddress, result.isBridgeLoading]);

  const isAddressValid = useMemo(() => {
    return hasValidAddress && result.hasBridgeValidationResult && !bridgeRecipientError;
  }, [hasValidAddress, result.hasBridgeValidationResult, bridgeRecipientError]);

  const hasAnyMatches =
    (result.matchedAccounts && result.matchedAccounts.length > 0) ||
    !!result.matchedRecentAddress ||
    !!result.ensName ||
    result.isLedgerAccount ||
    isSanctioned;

  const showSanctionedBanner = isSanctioned && hasSearchValue;

  const hasBridgeRecipientError =
    !!bridgeRecipientError && !isBridgeInvalidAddress && !showSanctionedBanner;
  const hasBridgeRecipientWarning = !!bridgeRecipientWarning;

  // Keep a complete match visible while search revalidates
  // first bridge wait is via isAddressComplete.
  const showMatchedAddress =
    showSearchResults &&
    (hasAnyMatches ||
      (isAddressComplete && result.status === "valid" && !result.error) ||
      (isAddressComplete && (hasBridgeRecipientError || hasBridgeRecipientWarning))) &&
    (result.status === "valid" ||
      (recipientSupportsDomain && result.status === "ens_resolved") ||
      result.isLedgerAccount ||
      !!result.matchedRecentAddress ||
      isSanctioned ||
      (isAddressComplete && (hasBridgeRecipientError || hasBridgeRecipientWarning)));

  const showAddressValidationError =
    showSearchResults &&
    !isLoading &&
    !showSanctionedBanner &&
    !hasAnyMatches &&
    (!!result.error || isBridgeInvalidAddress);

  const addressValidationErrorType = useMemo(() => {
    if (result.error) return result.error;
    if (isBridgeInvalidAddress) {
      if (searchValue.includes(".")) {
        return "wallet_not_exist";
      }
      return "incorrect_format";
    }
    return null;
  }, [result.error, isBridgeInvalidAddress, searchValue]);

  const showBridgeRecipientError =
    showSearchResults && hasBridgeRecipientError && !showAddressValidationError;

  const showBridgeRecipientWarning =
    showSearchResults &&
    !!bridgeRecipientWarning &&
    !showBridgeRecipientError &&
    !showAddressValidationError;

  const showBridgeSenderError = showSearchResults && !!bridgeSenderError;

  const showEmptyState =
    showSearchResults &&
    !isLoading &&
    (!isAddressComplete || !hasAnyMatches) &&
    !showMatchedAddress &&
    !showSanctionedBanner &&
    !showAddressValidationError &&
    !showBridgeRecipientError;

  return {
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
    isAddressValid,
    addressValidationErrorType,
    bridgeRecipientError,
    bridgeRecipientWarning,
    bridgeSenderError,
  };
}
