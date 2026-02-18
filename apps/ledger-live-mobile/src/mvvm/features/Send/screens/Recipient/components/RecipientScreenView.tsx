import { RecentAddress as RecentAddressType } from "@ledgerhq/live-common/flows/send/recipient/types";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { SendFlowLayout } from "LLM/features/Send/components/SendFlowLayout";
import React, { useCallback } from "react";
import { useRecipientScreenView } from "../hooks/useRecipientScreenView";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import { LoadingState } from "./LoadingState";
import { MyAccountsSection } from "./MyAccountsSection";
import { RecentAddressBottomSheet } from "./RecentAddressBottomSheet";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { ValidationBanner } from "./ValidationBanner";

type RecipientScreenViewProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
  recipientSupportsDomain: boolean;
}>;

export const RecipientScreenView = ({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
}: RecipientScreenViewProps) => {
  const {
    recentAddresses,
    handleAccountSelect,
    handleRecentAddressSelect,
    isLoading,
    showInitialState,
    showMatchedAddress,
    result,
    searchValue,
    showEmptyState,
    showInitialEmptyState,
    showBridgeSenderError,
    bridgeSenderError,
    showSanctionedBanner,
    showBridgeRecipientError,
    showBridgeRecipientWarning,
    showAddressValidationError,
    bridgeRecipientError,
    bridgeRecipientWarning,
    handleAddressSelect,
    selectedRecentAddress,
    setSelectedRecentAddress,
    isAddressComplete,
    handleRemoveAddress,
    addressValidationErrorType,
  } = useRecipientScreenView({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  const handleRecentAddressLongPress = useCallback(
    (recentAddress: RecentAddressType) => {
      setSelectedRecentAddress(recentAddress);
    },
    [setSelectedRecentAddress],
  );

  const handleRemoveRecentAddress = useCallback(
    (recentAddress: string) => {
      handleRemoveAddress(recentAddress);
      setSelectedRecentAddress(null);
    },
    [handleRemoveAddress, setSelectedRecentAddress],
  );

  return (
    <>
      <SendFlowLayout>
        <Box style={{ flex: 1, marginHorizontal: -8 }}>
          {isLoading && <LoadingState />}

          {showInitialState && (
            <>
              <RecentAddressesSection
                recentAddresses={recentAddresses}
                onSelect={handleRecentAddressSelect}
                onLongPress={handleRecentAddressLongPress}
              />
              <MyAccountsSection
                currentAccountId={account.id}
                currency={currency}
                onSelect={handleAccountSelect}
              />
            </>
          )}

          {showMatchedAddress && (
            <AddressMatchedSection
              searchResult={result}
              searchValue={searchValue}
              onSelect={handleAddressSelect}
              isSanctioned={showSanctionedBanner}
              isAddressComplete={isAddressComplete}
              hasBridgeError={showBridgeRecipientError || showBridgeRecipientWarning}
            />
          )}

          {showAddressValidationError && (
            <AddressValidationError error={addressValidationErrorType} />
          )}

          {(showEmptyState || showInitialEmptyState) && (
            <AddressValidationError translationKey="send.newSendFlow.recentSendWillAppear" />
          )}

          {shouldShowErrorBanner && (
            <Box lx={{ flex: 1, paddingVertical: "s8" }}>
              {showBridgeSenderError && (
                <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
              )}
              {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
              {showBridgeRecipientError && (
                <ValidationBanner
                  type="error"
                  error={bridgeRecipientError}
                  variant="recipient"
                  excludeRecipientRequired
                />
              )}
              {showBridgeRecipientWarning && (
                <ValidationBanner
                  type="warning"
                  warning={bridgeRecipientWarning}
                  variant="recipient"
                />
              )}
            </Box>
          )}
        </Box>
      </SendFlowLayout>
      {selectedRecentAddress && (
        <QueuedDrawerBottomSheet
          snapPoints={["25%"]}
          isRequestingToBeOpened={!!selectedRecentAddress}
          onClose={() => setSelectedRecentAddress(null)}
        >
          <RecentAddressBottomSheet
            selectedRecentAddress={selectedRecentAddress}
            handleRemoveAddress={handleRemoveRecentAddress}
          />
        </QueuedDrawerBottomSheet>
      )}
    </>
  );
};
