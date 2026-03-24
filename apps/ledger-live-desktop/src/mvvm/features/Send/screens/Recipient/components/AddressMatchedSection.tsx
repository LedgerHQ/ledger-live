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
  onSelect: (address: string, domainName?: string) => void;
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

  const { matchedAccounts, domainName, matchedRecentAddress, status, resolvedAddress } = searchResult;

  const hasMatchedAccounts = matchedAccounts && matchedAccounts.length > 0;
  const hasENS = !!domainName;
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
    return `${domainName} (${formattedAddress})`;
  };

  const getRecentDescription = (): string | undefined => {
    if (matchedRecentAddress) {
      return t("newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return formattedAddress;
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
            onSelect={() => onSelect(resolvedAddress ?? searchValue, domainName)}
            showSendTo
            disabled={isSanctioned || hasBridgeError}
            testId="send-matched-address-button"
          />
        )}

        {/* Show matched address */}
        {!hasENS && (hasMatchedAccounts || hasRecentMatch) && (
          <AddressListItem
            address={resolvedAddress ?? searchValue}
            description={getRecentDescription()}
            onSelect={() => onSelect(resolvedAddress ?? searchValue, matchedRecentAddress?.domainName)}
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
