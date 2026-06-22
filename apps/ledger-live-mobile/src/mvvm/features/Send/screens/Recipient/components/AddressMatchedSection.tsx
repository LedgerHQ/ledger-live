import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { AddressListItem } from "./AddressListItem";

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

  const { ensName, status, resolvedAddress } = searchResult;

  const hasENS = !!ensName;

  const isValidAddressWithoutMatch =
    isAddressComplete && !hasENS && !isSanctioned && !hasBridgeError && status === "valid";

  const shouldShowDisabledAddress = (isSanctioned || hasBridgeError) && isAddressComplete;

  if (!hasENS && !shouldShowDisabledAddress && !isValidAddressWithoutMatch) {
    return null;
  }

  const formattedAddress = formatAddress(resolvedAddress ?? searchValue, {
    prefixLength: 5,
    suffixLength: 5,
  });

  const getENSDisplayTitle = (): string => {
    return `${ensName} (${formattedAddress})`;
  };

  return (
    <Box lx={{ flex: 1, flexDirection: "column" }}>
      <Subheader lx={{ marginBottom: "s12", marginHorizontal: "s8" }}>
        <SubheaderRow>
          <SubheaderTitle>{t("send.newSendFlow.addressMatched")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ flexDirection: "column" }}>
        {/* Show ENS result if available */}
        {hasENS && (
          <AddressListItem
            address={resolvedAddress ?? searchValue}
            name={getENSDisplayTitle()}
            description={formattedAddress}
            onSelect={() => onSelect(resolvedAddress ?? searchValue, ensName)}
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

        {/* Show disabled address if sanctioned or has bridge error */}
        {shouldShowDisabledAddress && !hasENS && (
          <AddressListItem
            address={searchValue}
            name={formattedAddress}
            description={formattedAddress}
            showSendTo
            disabled={true}
          />
        )}
      </Box>
    </Box>
  );
}
