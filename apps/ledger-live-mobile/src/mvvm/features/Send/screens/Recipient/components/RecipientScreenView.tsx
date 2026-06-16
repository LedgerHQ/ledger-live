import { RecentAddress as RecentAddressType } from "@ledgerhq/live-common/flows/send/recipient/types";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { SendFlowLayout } from "LLM/features/Send/components/SendFlowLayout";
import { MemoControls } from "LLM/features/Send/components/Memo/MemoControls";
import { useMemoViewModel } from "LLM/features/Send/components/Memo/hooks/useMemoViewModel";
import { shouldShowMatchedAddress } from "@ledgerhq/live-common/flows/send/recipient/utils/shouldShowMatchedAddress";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import React, { useCallback } from "react";
import { useRecipientScreenView } from "../hooks/useRecipientScreenView";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import { LoadingState } from "./LoadingState";
import { MyAccountsSection } from "./MyAccountsSection";
import { PasteFromClipboard } from "./PasteFromClipboard";
import { RecentAddressBottomSheet } from "./RecentAddressBottomSheet";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { ValidationBanner } from "./ValidationBanner";

type RecipientScreenViewProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
  recipientSupportsDomain: boolean;
  onMemoProceed: () => void;
}>;

export const RecipientScreenView = ({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
  onMemoProceed,
}: RecipientScreenViewProps) => {
  const {
    recentAddresses,
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
    clipboardAddress,
    handlePasteFromClipboard,
  } = useRecipientScreenView({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  const { uiConfig, recipientSearch } = useSendFlowData();
  const resolvedAddress = result?.resolvedAddress ?? searchValue;
  const showMemo = uiConfig.hasMemo && isAddressComplete;
  const memoVm = useMemoViewModel({
    address: showMemo ? resolvedAddress : "",
    onSkip: onMemoProceed,
  });
  const showMatched = shouldShowMatchedAddress({
    showMatchedAddress,
    hasMemo: uiConfig.hasMemo,
    hasFilledMemo: memoVm.hasFilledMemo,
    hasMemoError: !!memoVm.memoError,
  });

  const revealAddress = useCallback(
    (address: string, ensName?: string) => {
      if (uiConfig.hasMemo) {
        recipientSearch.setValue(address);
      } else {
        onAddressSelected(address, ensName);
      }
    },
    [uiConfig.hasMemo, recipientSearch, onAddressSelected],
  );

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
              {clipboardAddress && (
                <PasteFromClipboard address={clipboardAddress} onPaste={handlePasteFromClipboard} />
              )}
              <RecentAddressesSection
                recentAddresses={recentAddresses}
                onSelect={recent => revealAddress(recent.address, recent.ensName)}
                onLongPress={handleRecentAddressLongPress}
              />
              <MyAccountsSection
                currentAccountId={account.id}
                currency={currency}
                onSelect={selectedAccount => revealAddress(selectedAccount.freshAddress)}
              />
            </>
          )}

          {showMemo && <MemoControls vm={memoVm} />}

          {showMatched && (
            <AddressMatchedSection
              searchResult={result}
              searchValue={searchValue}
              onSelect={handleAddressSelect}
              isSanctioned={showSanctionedBanner}
              isAddressComplete={isAddressComplete}
              hasBridgeError={showBridgeRecipientError}
            />
          )}

          {showAddressValidationError && (
            <AddressValidationError error={addressValidationErrorType} />
          )}

          {(showEmptyState || showInitialEmptyState) && (
            <AddressValidationError translationKey="send.newSendFlow.recentSendWillAppear" />
          )}

          {shouldShowErrorBanner && (
            <Box lx={{ marginHorizontal: "s8", gap: "s16" }}>
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
