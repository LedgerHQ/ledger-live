import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Subheader } from "@ledgerhq/ldls-ui-react";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import { AddressListItem } from "./AddressListItem";
import { AccountRowWithBalance } from "./AccountRowWithBalance";
import { formatRelativeDate } from "../utils/dateFormatter";
import type { AddressSearchResult } from "../../../types";

type AddressMatchedSectionProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
}>;

export function AddressMatchedSection({
  searchResult,
  searchValue,
  onSelect,
  isSanctioned = false,
  isAddressComplete = false,
}: AddressMatchedSectionProps) {
  const { t } = useTranslation();

  const hasMatchedAccounts =
    searchResult.matchedAccounts && searchResult.matchedAccounts.length > 0;
  const hasENS = !!searchResult.ensName;
  const hasRecentMatch = !!searchResult.matchedRecentAddress;

  // Don't render if there's nothing to show
  if (!hasMatchedAccounts && !hasENS && !hasRecentMatch && !isSanctioned) {
    return null;
  }

  const getENSDisplayTitle = (): string => {
    return `${searchResult.ensName} (${formatAddress(searchResult.resolvedAddress ?? searchValue, {
      prefixLength: 5,
      suffixLength: 5,
    })})`;
  };

  const getRecentDescription = (): string => {
    const recent = searchResult.matchedRecentAddress;
    if (recent) {
      return `Already used · ${formatRelativeDate(recent.lastUsedAt)}`;
    }
    return formatAddress(searchResult.resolvedAddress ?? searchValue, {
      prefixLength: 5,
      suffixLength: 5,
    });
  };

  return (
    <div className="w-full min-w-0 flex flex-col mt-8">
      <Subheader className="mb-12 px-24" title={t("newSendFlow.addressMatched")} />
      <div className="flex flex-col gap-12 px-12">
        {/* Show all matched Ledger accounts */}
        {hasMatchedAccounts &&
          searchResult.matchedAccounts?.map(({ account }) => (
            <AccountRowWithBalance
              key={account.id}
              account={account}
              onSelect={() => onSelect(account.freshAddress)}
              showSendTo
              disabled={isSanctioned}
            />
          ))}

        {/* Show ENS result if available and no matched accounts */}
        {hasENS && !hasMatchedAccounts && (
          <AddressListItem
            address={searchResult.resolvedAddress ?? searchValue}
            name={getENSDisplayTitle()}
            description={formatAddress(searchResult.resolvedAddress ?? searchValue, {
              prefixLength: 5,
              suffixLength: 5,
            })}
            onSelect={() =>
              onSelect(searchResult.resolvedAddress ?? searchValue, searchResult.ensName)
            }
            showSendTo
            disabled={isSanctioned}
          />
        )}

        {/* Show recent match if available and no matched accounts or ENS */}
        {hasRecentMatch && !hasMatchedAccounts && !hasENS && (
          <AddressListItem
            address={searchResult.matchedRecentAddress!.address}
            name={
              searchResult.matchedRecentAddress!.name ??
              formatAddress(searchResult.matchedRecentAddress!.address, {
                prefixLength: 5,
                suffixLength: 5,
              })
            }
            description={getRecentDescription()}
            onSelect={() =>
              onSelect(
                searchResult.matchedRecentAddress!.address,
                searchResult.matchedRecentAddress!.ensName,
              )
            }
            showSendTo
            disabled={isSanctioned}
          />
        )}

        {/* Show address if sanctioned (even if no match) */}
        {isSanctioned && !hasMatchedAccounts && !hasENS && !hasRecentMatch && (
          <AddressListItem
            address={searchValue}
            name={formatAddress(searchValue, { prefixLength: 5, suffixLength: 5 })}
            description={formatAddress(searchValue, { prefixLength: 5, suffixLength: 5 })}
            onSelect={() => {}}
            showSendTo
            disabled={true}
          />
        )}

        {searchResult.isFirstInteraction && !isSanctioned && isAddressComplete && (
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
