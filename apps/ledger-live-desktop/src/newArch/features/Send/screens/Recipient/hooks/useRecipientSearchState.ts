import { useMemo } from "react";
import type { AddressSearchResult } from "../types";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";

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

  const showSanctionedBanner = isSanctioned && hasSearchValue;

  const bridgeRecipientError = result.bridgeErrors?.recipient;
  const bridgeRecipientWarning = result.bridgeWarnings?.recipient;
  const bridgeSenderError = result.bridgeErrors?.sender;

  const isSelfTransferError =
    bridgeRecipientError instanceof InvalidAddressBecauseDestinationIsAlsoSource;
  const isBridgeInvalidAddress =
    bridgeRecipientError instanceof InvalidAddress && !isSelfTransferError;

  const hasBridgeRecipientError =
    !!bridgeRecipientError && !isBridgeInvalidAddress && !showSanctionedBanner;
  const hasBridgeRecipientWarning = !!bridgeRecipientWarning;

  const showMatchedAddress =
    showSearchResults &&
    (hasAnyMatches ||
      (result.status === "valid" && !result.error && !isBridgeInvalidAddress) ||
      (isAddressComplete && (hasBridgeRecipientError || hasBridgeRecipientWarning))) &&
    (result.status === "valid" ||
      (recipientSupportsDomain && result.status === "ens_resolved") ||
      result.isLedgerAccount ||
      !!result.matchedRecentAddress ||
      isSanctioned ||
      (isAddressComplete && (hasBridgeRecipientError || hasBridgeRecipientWarning)));

  const showAddressValidationError =
    showSearchResults &&
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
  };
}
