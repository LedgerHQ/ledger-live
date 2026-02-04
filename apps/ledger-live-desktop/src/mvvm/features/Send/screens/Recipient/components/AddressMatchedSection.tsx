import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { formatAddress } from "LLD/features/ModularDialog/components/Address/formatAddress";
import { AddressListItem } from "./AddressListItem";
import { AccountRowWithBalance } from "./AccountRowWithBalance";
import { formatRelativeDate } from "../utils/dateFormatter";
import type { AddressSearchResult } from "../types";

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

  const { matchedAccounts, ensName, matchedRecentAddress, status, resolvedAddress } = searchResult;

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

  const getRecentDescription = (): string | undefined => {
    if (matchedRecentAddress) {
      return t("newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return formattedAddress;
  };

  return (
    <div data-testid="send-address-matched-title" className="flex w-full min-w-0 flex-col">
      <Subheader className="mb-12">
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.addressMatched")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div className="-mx-8 flex flex-col">
        {/* Show all matched Ledger accounts */}
        {hasMatchedAccounts &&
          matchedAccounts?.map(({ account }) => (
            <AccountRowWithBalance
              key={account.id}
              account={account}
              onSelect={() => onSelect(account.freshAddress)}
              showSendTo
              disabled={isSanctioned || hasBridgeError}
            />
          ))}

        {/* Show ENS result if available and no matched accounts */}
        {hasENS && !hasMatchedAccounts && (
          <AddressListItem
            address={resolvedAddress ?? searchValue}
            name={getENSDisplayTitle()}
            description={formattedAddress}
            onSelect={() => onSelect(resolvedAddress ?? searchValue, ensName)}
            showSendTo
            disabled={isSanctioned || hasBridgeError}
          />
        )}

        {/* Show recent match if available and no matched accounts or ENS */}
        {hasRecentMatch && !hasMatchedAccounts && !hasENS && (
          <AddressListItem
            address={matchedRecentAddress?.address ?? searchValue}
            name={formatAddress(matchedRecentAddress?.address ?? searchValue, {
              prefixLength: 5,
              suffixLength: 5,
            })}
            description={getRecentDescription()}
            onSelect={() =>
              onSelect(matchedRecentAddress?.address ?? searchValue, matchedRecentAddress?.ensName)
            }
            showSendTo
            disabled={isSanctioned || hasBridgeError}
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
          />
        )}

        {searchResult.isFirstInteraction &&
          !isSanctioned &&
          !hasBridgeError &&
          isAddressComplete && (
            <Banner
              appearance="info"
              title={t("newSendFlow.firstInteraction.title")}
              description={t("newSendFlow.firstInteraction.description")}
            />
          )}
      </div>
    </div>
  );
}
