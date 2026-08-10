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
import { RecipientCard } from "./RecipientCard";
import { useFormatRelativeDate } from "../hooks/useFormatRelativeDate";

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
  const helpSheetRef = useBottomSheetRef();
  const openHelpSheet = useCallback(() => {
    Keyboard.dismiss();
    helpSheetRef.current?.present();
  }, [helpSheetRef]);

  const {
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

  const getRecentDescription = (): string => {
    if (matchedRecentAddress) {
      return t("send.newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return formattedAddress;
  };

  const getRecipientCardDescription = (): string | undefined => {
    if (ensName) {
      return recipientAddress;
    }
    if (matchedRecentAddress) {
      return t("send.newSendFlow.alreadyUsed", {
        date: formatRelativeDate(matchedRecentAddress.lastUsedAt),
      });
    }
    return undefined;
  };

  return (
    <Box lx={{ flexDirection: "column" }}>
      {!shouldRenderContactsRecipientCard && (
        <Subheader lx={{ marginBottom: "s12", marginHorizontal: "s8" }}>
          <SubheaderRow>
            <SubheaderTitle>{t("send.newSendFlow.addressMatched")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      )}
      <Box lx={{ flexDirection: "column" }}>
        {shouldRenderContactsRecipientCard && (
          <RecipientCard
            recipient={ensName ?? recipientAddress}
            description={getRecipientCardDescription()}
            contact={matchedContact}
            isReady={isContactsRecipientReady}
            hasAddressBook={hasAddressBook}
            addressBookUnsupportedLabel={t("send.newSendFlow.addressBookUnsupported", {
              family: addressBookFamilyName,
            })}
            addContactLabel={t("contacts.addContact")}
            sendLabel={t("contacts.addressDetail.send")}
            onSend={() => onSelect(recipientAddress, ensName)}
          />
        )}

        {!shouldRenderContactsRecipientCard && (
          <>
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

            {hasMatchedContact && !hasMatchedAccounts && (
              <AddressListItem
                address={matchedContact.address}
                name={matchedContact.contactName}
                description={formattedAddress}
                onSelect={() => onSelect(matchedContact.address, ensName)}
                showSendTo
                disabled={isSanctioned || hasBridgeError}
                testID="new-send-flow-address-confirm"
              />
            )}

            {/* Show ENS result if available and no matched accounts or contact */}
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

            {/* Show recent match if available and no matched accounts, contact or ENS */}
            {hasRecentMatch && !hasMatchedAccounts && !hasMatchedContact && !ensName && (
              <AddressListItem
                address={matchedRecentAddress?.address ?? searchValue}
                name={formatAddress(
                  matchedRecentAddress?.address ?? searchValue,
                  SEND_ADDRESS_FORMAT_OPTIONS,
                )}
                description={getRecentDescription()}
                onSelect={() =>
                  onSelect(
                    matchedRecentAddress?.address ?? searchValue,
                    matchedRecentAddress?.ensName,
                  )
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
          </>
        )}
      </Box>
      <Box
        lx={{
          flexDirection: "column",
          marginVertical: "s16",
          marginHorizontal: "s8",
        }}
      >
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
