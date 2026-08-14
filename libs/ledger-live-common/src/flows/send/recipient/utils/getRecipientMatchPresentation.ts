import type { AddressSearchResult, MatchedContact, MatchedAccount, RecentAddress } from "../types";
import { addressesMatch } from "./addressesMatch";

type GetRecipientMatchPresentationArgs = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
  isContactsFeatureEnabled?: boolean;
}>;

type RecipientCardMatchPresentation = Readonly<{
  kind: "recipient-card";
  recipientAddress: string;
  ensName: string | undefined;
  matchedContact: MatchedContact | undefined;
  matchedRecentAddress: RecentAddress | undefined;
  isReady: boolean;
}>;

type MatchedContactPresentation = Readonly<{
  kind: "matched-contact";
  address: string;
  ensName: string | undefined;
  matchedContact: MatchedContact;
  isDisabled: boolean;
}>;

type MatchedEnsPresentation = Readonly<{
  kind: "matched-ens";
  address: string;
  ensName: string;
  isDisabled: boolean;
}>;

type MatchedLedgerAccountPresentation = Readonly<{
  kind: "matched-ledger-account";
  address: string;
  accountName: string | undefined;
  matchedAccounts: readonly MatchedAccount[];
  matchedRecentAddress: RecentAddress | undefined;
  isDisabled: boolean;
}>;

type MatchedRecentAddressPresentation = Readonly<{
  kind: "matched-recent-address";
  address: string;
  matchedRecentAddress: RecentAddress;
  isDisabled: boolean;
}>;

type ValidAddressPresentation = Readonly<{
  kind: "valid-address";
  address: string;
}>;

type DisabledAddressPresentation = Readonly<{
  kind: "disabled-address";
  address: string;
}>;

export type RecipientMatchPresentation =
  | RecipientCardMatchPresentation
  | MatchedContactPresentation
  | MatchedEnsPresentation
  | MatchedLedgerAccountPresentation
  | MatchedRecentAddressPresentation
  | ValidAddressPresentation
  | DisabledAddressPresentation;

/**
 * Selects the recipient suggestion that should be presented for a validated search.
 *
 * This deliberately contains no platform-specific formatting, translations, feature reads,
 * or UI callbacks so Desktop and Mobile can render the same decision with their own primitives.
 */
export function getRecipientMatchPresentation({
  searchResult,
  searchValue,
  isSanctioned = false,
  isAddressComplete = false,
  hasBridgeError = false,
  isContactsFeatureEnabled = false,
}: GetRecipientMatchPresentationArgs): RecipientMatchPresentation | null {
  const {
    accountName,
    matchedAccounts,
    ensName,
    matchedRecentAddress,
    matchedContact,
    status,
    resolvedAddress,
  } = searchResult;
  const recipientAddress = resolvedAddress ?? searchValue;
  const hasMatchedAccounts = matchedAccounts.length > 0;
  const hasMatchedContact = isContactsFeatureEnabled && !!matchedContact;
  const hasENS = !!ensName && !hasMatchedContact;
  const hasRecentMatch = !!matchedRecentAddress;
  const hasMatch = hasMatchedAccounts || hasMatchedContact || hasENS || hasRecentMatch;
  const hasExactMatchedAccount = matchedAccounts.some(({ account }) =>
    addressesMatch(account.freshAddress, recipientAddress),
  );
  const hasExactRecentMatch =
    !!matchedRecentAddress && addressesMatch(matchedRecentAddress.address, recipientAddress);
  const hasPartialLegacyMatch =
    (hasMatchedAccounts && !hasExactMatchedAccount) || (hasRecentMatch && !hasExactRecentMatch);
  const isLocallyValidatedRecipient = status === "valid" || status === "ens_resolved";
  const shouldRenderRecipientCard =
    isContactsFeatureEnabled &&
    !isSanctioned &&
    !hasBridgeError &&
    (hasMatchedContact ||
      hasENS ||
      hasExactMatchedAccount ||
      hasExactRecentMatch ||
      (isLocallyValidatedRecipient && !hasPartialLegacyMatch));
  const isReady =
    isAddressComplete &&
    !isSanctioned &&
    !hasBridgeError &&
    (status === "valid" || status === "ens_resolved");
  const isDisabled = isSanctioned || hasBridgeError;
  const isValidAddressWithoutMatch =
    isAddressComplete && !hasMatch && !isDisabled && status === "valid";
  const shouldShowDisabledAddress = isDisabled && isAddressComplete;

  if (shouldRenderRecipientCard) {
    return {
      kind: "recipient-card",
      recipientAddress,
      ensName,
      matchedContact,
      matchedRecentAddress,
      isReady,
    };
  }

  if (hasMatchedAccounts) {
    return {
      kind: "matched-ledger-account",
      address: recipientAddress,
      accountName,
      matchedAccounts,
      matchedRecentAddress,
      isDisabled,
    };
  }

  if (hasMatchedContact && matchedContact) {
    return {
      kind: "matched-contact",
      address: matchedContact.address,
      ensName,
      matchedContact,
      isDisabled,
    };
  }

  if (hasENS && ensName) {
    return {
      kind: "matched-ens",
      address: recipientAddress,
      ensName,
      isDisabled,
    };
  }

  if (hasRecentMatch && matchedRecentAddress) {
    return {
      kind: "matched-recent-address",
      address: recipientAddress,
      matchedRecentAddress,
      isDisabled,
    };
  }

  if (isValidAddressWithoutMatch) {
    return {
      kind: "valid-address",
      address: searchValue,
    };
  }

  if (shouldShowDisabledAddress) {
    return {
      kind: "disabled-address",
      address: searchValue,
    };
  }

  return null;
}
