import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";
import { AddressListItem } from "./AddressListItem";
import { RecentHistoryWarningCard } from "./RecentHistoryWarningCard";

type AddressMatchedSectionProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
}>;

export function AddressMatchedSection({
  searchResult,
  searchValue,
  onSelect,
  isSanctioned = false,
  isAddressComplete = false,
  hasBridgeError = false,
}: AddressMatchedSectionProps) {
  const { t } = useTranslation();
  const formatRelativeDate = useFormatRelativeDate();

  const { accountName, matchedAccounts, ensName, matchedRecentAddress, status, resolvedAddress } =
    searchResult;

  const hasMatchedAccounts = matchedAccounts && matchedAccounts.length > 0;
  const hasENS = !!ensName;
  const hasRecentMatch = !!matchedRecentAddress;
  const hasMatch = hasMatchedAccounts || hasENS || hasRecentMatch;

  const isValidAddressWithoutMatch =
    isAddressComplete && !hasMatch && !isSanctioned && !hasBridgeError && status === "valid";

  const shouldShowDisabledAddress = (isSanctioned || hasBridgeError) && isAddressComplete;

  if (!hasMatch && !shouldShowDisabledAddress && !isValidAddressWithoutMatch) {
    return null;
  }

  const formattedAddress = formatAddress(resolvedAddress ?? searchValue, {
    prefixLength: 5,
    suffixLength: 5,
  });

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
      <Subheader className="mb-12">
        <SubheaderRow>
          <SubheaderTitle data-testid="send-address-matched-title">
            {t("newSendFlow.addressMatched")}
          </SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div className="-mx-8 flex flex-col">
        {/* Show ENS result if available */}
        {hasENS && (
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

        {/* Show matched address */}
        {!hasENS && (hasMatchedAccounts || hasRecentMatch) && (
          <AddressListItem
            address={resolvedAddress ?? searchValue}
            name={getMatchedAccountDisplayTitle()}
            description={getMatchedAddressDescription()}
            onSelect={() => onSelect(resolvedAddress ?? searchValue, matchedRecentAddress?.ensName)}
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

        {searchResult.isFirstInteraction &&
          !isSanctioned &&
          !hasBridgeError &&
          isAddressComplete && <RecentHistoryWarningCard />}
      </div>
    </div>
  );
}
