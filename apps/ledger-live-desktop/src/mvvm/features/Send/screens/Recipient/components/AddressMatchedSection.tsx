import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { useFeature } from "@features/platform-feature-flags";
import React from "react";
import { useTranslation } from "react-i18next";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";
import { AddressListItem } from "./AddressListItem";
import { RecentHistoryWarningCard } from "./RecentHistoryWarningCard";
import { RecipientCard } from "./RecipientCard";

type AddressMatchedSectionProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
  isContactsFeatureEnabled?: boolean;
  hasAddressBook?: boolean;
  addressBookFamilyName?: string;
}>;

export function AddressMatchedSection({
  searchResult,
  searchValue,
  onSelect,
  isSanctioned = false,
  isAddressComplete = false,
  hasBridgeError = false,
  isContactsFeatureEnabled = false,
  hasAddressBook = false,
  addressBookFamilyName = "",
}: AddressMatchedSectionProps) {
  const { t } = useTranslation();
  const formatRelativeDate = useFormatRelativeDate();
  const isFirstInteractionBannerEnabled =
    useFeature("newSendFlowFirstInteractionBanner")?.enabled ?? false;

  const {
    accountName,
    matchedAccounts,
    ensName,
    matchedRecentAddress,
    matchedContact,
    status,
    resolvedAddress,
  } = searchResult;

  const hasMatchedAccounts = matchedAccounts && matchedAccounts.length > 0;
  const hasMatchedContact = isContactsFeatureEnabled && !!matchedContact;
  const hasENS = !!ensName && !hasMatchedContact;
  const hasRecentMatch = !!matchedRecentAddress;
  const hasMatch = hasMatchedAccounts || hasMatchedContact || hasENS || hasRecentMatch;
  const recipientAddress = resolvedAddress ?? searchValue;
  const normalizedRecipientAddress = recipientAddress.toLowerCase();
  const hasExactMatchedAccount =
    matchedAccounts?.some(
      ({ account }) => account.freshAddress.toLowerCase() === normalizedRecipientAddress,
    ) ?? false;
  const hasExactRecentMatch =
    matchedRecentAddress?.address.toLowerCase() === normalizedRecipientAddress;
  const hasPartialLegacyMatch =
    (hasMatchedAccounts && !hasExactMatchedAccount) || (hasRecentMatch && !hasExactRecentMatch);
  const isLocallyValidatedRecipient = status === "valid" || status === "ens_resolved";
  const hasContactsRecipientCandidate =
    isContactsFeatureEnabled &&
    !isSanctioned &&
    !hasBridgeError &&
    (hasMatchedContact ||
      hasENS ||
      hasExactMatchedAccount ||
      hasExactRecentMatch ||
      (isLocallyValidatedRecipient && !hasPartialLegacyMatch));

  const isValidAddressWithoutMatch =
    isAddressComplete && !hasMatch && !isSanctioned && !hasBridgeError && status === "valid";

  const shouldShowDisabledAddress = (isSanctioned || hasBridgeError) && isAddressComplete;

  if (
    !hasMatch &&
    !shouldShowDisabledAddress &&
    !isValidAddressWithoutMatch &&
    !hasContactsRecipientCandidate
  ) {
    return null;
  }

  const formattedAddress = formatAddress(
    resolvedAddress ?? searchValue,
    SEND_ADDRESS_FORMAT_OPTIONS,
  );
  const isContactsRecipientReady =
    isContactsFeatureEnabled &&
    isAddressComplete &&
    !isSanctioned &&
    !hasBridgeError &&
    (status === "valid" || status === "ens_resolved");
  const shouldRenderContactsRecipientCard = hasContactsRecipientCandidate;

  const getENSDisplayTitle = (): string => {
    return `${ensName} (${formattedAddress})`;
  };

  const getMatchedAccountDisplayTitle = (): string | undefined => {
    if (hasMatchedAccounts && accountName) {
      return accountName;
    }
    return undefined;
  };

  const getAlreadyUsedDescription = (): string | undefined => {
    if (matchedRecentAddress) {
      return t("newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return undefined;
  };

  const getMatchedAddressDescription = (): string | undefined => {
    const alreadyUsedDescription = getAlreadyUsedDescription();
    return alreadyUsedDescription ?? formattedAddress;
  };

  return (
    <div className="flex w-full min-w-0 flex-col">
      {!shouldRenderContactsRecipientCard && (
        <Subheader className="mb-12">
          <SubheaderRow>
            <SubheaderTitle data-testid="send-address-matched-title">
              {t("newSendFlow.addressMatched")}
            </SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      )}
      <div className="-mx-8 flex flex-col">
        {shouldRenderContactsRecipientCard && (
          <RecipientCard
            recipient={ensName ?? recipientAddress}
            description={ensName ? recipientAddress : getAlreadyUsedDescription()}
            contact={matchedContact}
            isReady={isContactsRecipientReady}
            hasAddressBook={hasAddressBook}
            addressBookUnsupportedLabel={t("newSendFlow.addressBookUnsupported", {
              family: addressBookFamilyName,
            })}
            addContactLabel={t("contacts.addContact")}
            sendLabel={t("contacts.addressDetail.send")}
            onSend={() => onSelect(recipientAddress, ensName)}
          />
        )}

        {!shouldRenderContactsRecipientCard && (
          <>
            {/* Show matched contact with priority over ENS */}
            {hasMatchedContact && !hasMatchedAccounts && (
              <AddressListItem
                address={matchedContact.address}
                name={matchedContact.contactName}
                description={formattedAddress}
                onSelect={() => onSelect(matchedContact.address, ensName)}
                showSendTo
                disabled={isSanctioned || hasBridgeError}
                testId="send-matched-address-button"
              />
            )}

            {/* Show ENS result if available and no matched contact */}
            {hasENS && !hasMatchedAccounts && (
              <AddressListItem
                address={resolvedAddress ?? searchValue}
                name={getENSDisplayTitle()}
                description={formattedAddress}
                onSelect={() => onSelect(resolvedAddress ?? searchValue, ensName)}
                showSendTo
                disabled={isSanctioned || hasBridgeError}
                testId="send-matched-address-button"
              />
            )}

            {/* Show matched Ledger account or recent address */}
            {!hasENS && !hasMatchedContact && (hasMatchedAccounts || hasRecentMatch) && (
              <AddressListItem
                address={resolvedAddress ?? searchValue}
                name={getMatchedAccountDisplayTitle()}
                description={getMatchedAddressDescription()}
                onSelect={() =>
                  onSelect(resolvedAddress ?? searchValue, matchedRecentAddress?.ensName)
                }
                showSendTo
                isLedgerAccount={hasMatchedAccounts}
                disabled={isSanctioned || hasBridgeError}
                testId="send-matched-address-button"
              />
            )}

            {/* Show valid address without match (new address) */}
            {isValidAddressWithoutMatch && (
              <AddressListItem
                address={searchValue}
                name={formattedAddress}
                onSelect={() => onSelect(searchValue)}
                showSendTo
                disabled={false}
                hideDescription
                testId="send-matched-address-button"
              />
            )}

            {/* Show disabled address if sanctioned or has bridge error (even if no match) */}
            {shouldShowDisabledAddress && !hasMatch && (
              <AddressListItem
                address={searchValue}
                name={formattedAddress}
                description={formattedAddress}
                showSendTo
                disabled={true}
                testId="send-matched-address-button"
              />
            )}
          </>
        )}

        {isFirstInteractionBannerEnabled &&
          searchResult.isFirstInteraction &&
          !isSanctioned &&
          !hasBridgeError &&
          isAddressComplete && <RecentHistoryWarningCard />}
      </div>
    </div>
  );
}
