import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import {
  Banner,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import React, { useCallback } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "~/context/Locale";
import { AccountRowWithBalance } from "./AccountRowWithBalance";
import { AddressListItem } from "./AddressListItem";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";

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
  const isFirstInteractionBannerEnabled =
    useFeature("newSendFlowFirstInteractionBanner")?.enabled ?? false;
  const helpSheetRef = useBottomSheetRef();
  const openHelpSheet = useCallback(() => {
    Keyboard.dismiss();
    helpSheetRef.current?.present();
  }, [helpSheetRef]);

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

  const formattedAddress = formatAddress(
    resolvedAddress ?? searchValue,
    SEND_ADDRESS_FORMAT_OPTIONS,
  );

  const getENSDisplayTitle = (): string => {
    return `${ensName} (${formattedAddress})`;
  };

  const getRecentDescription = (): string => {
    if (matchedRecentAddress) {
      return t("send.newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return formattedAddress;
  };

  return (
    <Box lx={{ flexDirection: "column" }}>
      <Subheader lx={{ marginBottom: "s12", marginHorizontal: "s8" }}>
        <SubheaderRow>
          <SubheaderTitle>{t("send.newSendFlow.addressMatched")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ flexDirection: "column" }}>
        {/* Show all matched Ledger accounts */}
        {hasMatchedAccounts &&
          matchedAccounts?.map(({ account }) => (
            <AccountRowWithBalance
              key={account.id}
              account={account}
              onSelect={() => onSelect(account.freshAddress)}
              showSendTo
              disabled={isSanctioned || hasBridgeError}
              testID="new-send-flow-address-confirm"
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
            testID="new-send-flow-address-confirm"
          />
        )}

        {/* Show recent match if available and no matched accounts or ENS */}
        {hasRecentMatch && !hasMatchedAccounts && !hasENS && (
          <AddressListItem
            address={matchedRecentAddress?.address ?? searchValue}
            name={formatAddress(
              matchedRecentAddress?.address ?? searchValue,
              SEND_ADDRESS_FORMAT_OPTIONS,
            )}
            description={getRecentDescription()}
            onSelect={() =>
              onSelect(matchedRecentAddress?.address ?? searchValue, matchedRecentAddress?.ensName)
            }
            showSendTo
            disabled={isSanctioned || hasBridgeError}
            testID="new-send-flow-address-confirm"
          />
        )}

        {/* Show valid address without match (new address) */}
        {isValidAddressWithoutMatch && (
          <AddressListItem
            address={searchValue}
            name={formattedAddress}
            description={t("send.newSendFlow.notInRecentHistory")}
            onSelect={() => onSelect(searchValue)}
            showSendTo
            disabled={false}
            testID="new-send-flow-address-confirm"
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
      </Box>
      <Box lx={{ flexDirection: "column", marginVertical: "s16", marginHorizontal: "s8" }}>
        {isFirstInteractionBannerEnabled &&
          searchResult.isFirstInteraction &&
          !isSanctioned &&
          !hasBridgeError &&
          isAddressComplete && (
            <Banner
              appearance="info"
              description={t("send.newSendFlow.firstInteraction.description")}
              primaryAction={
                <Button appearance="gray" size="sm" onPress={openHelpSheet}>
                  {t("send.newSendFlow.firstInteraction.learnMore")}
                </Button>
              }
            />
          )}
      </Box>
      <BottomSheet ref={helpSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView>
          <BottomSheetHeader />
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s48", gap: "s12" }}>
            <Text typography="heading2SemiBold" lx={{ color: "base" }}>
              {t("send.newSendFlow.firstInteraction.helpTitle")}
            </Text>
            <Text typography="body1" lx={{ color: "base" }}>
              {t("send.newSendFlow.firstInteraction.helpDescription")}
            </Text>
          </Box>
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
}
