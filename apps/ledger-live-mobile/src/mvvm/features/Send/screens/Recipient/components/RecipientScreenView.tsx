import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { SendFlowLayout } from "LLM/features/Send/components/SendFlowLayout";
import { MemoControls } from "LLM/features/Send/components/Memo/MemoControls";
import { useMemoViewModel } from "LLM/features/Send/components/Memo/hooks/useMemoViewModel";
import { shouldShowMatchedAddress } from "@ledgerhq/live-common/flows/send/recipient/utils/shouldShowMatchedAddress";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import React, { useCallback, useMemo } from "react";
import { useRecipientScreenView } from "../hooks/useRecipientScreenView";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import { LoadingState } from "./LoadingState";
import { PasteFromClipboard } from "./PasteFromClipboard";
import { ValidationBanner } from "./ValidationBanner";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

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
    isLoading,
    showInitialState,
    showMatchedAddress,
    result,
    searchValue,
    showBridgeSenderError,
    bridgeSenderError,
    showSanctionedBanner,
    showBridgeRecipientError,
    showBridgeRecipientWarning,
    showAddressValidationError,
    bridgeRecipientError,
    bridgeRecipientWarning,
    handleAddressSelect,
    isAddressComplete,
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

  const { uiConfig } = useSendFlowData();
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

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return {
      ...getSendFlowTrackingProperties(account, parentAccount),
      button: "my accounts",
      page: "step recipient",
    };
  }, [account, parentAccount]);

  const handleMatchedAddress = useCallback(
    (address: string, ensName?: string) => {
      track("button_clicked", trackingProperties);
      handleAddressSelect(address, ensName);
    },
    [track, trackingProperties, handleAddressSelect],
  );

  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  return (
    <SendFlowLayout>
      <Box style={{ flex: 1, marginHorizontal: -8 }}>
        {isLoading && <LoadingState />}

        {showInitialState && clipboardAddress && (
          <PasteFromClipboard
            address={clipboardAddress}
            onPaste={handlePasteFromClipboard}
          />
        )}

        {showMemo && <MemoControls vm={memoVm} />}

        {showMatched && (
          <AddressMatchedSection
            searchResult={result}
            searchValue={searchValue}
            onSelect={handleMatchedAddress}
            isSanctioned={showSanctionedBanner}
            isAddressComplete={isAddressComplete}
            hasBridgeError={showBridgeRecipientError}
          />
        )}

        {showAddressValidationError && (
          <AddressValidationError error={addressValidationErrorType} />
        )}

        {shouldShowErrorBanner && (
          <Box lx={{ marginHorizontal: "s8", gap: "s16" }}>
            {showBridgeSenderError && (
              <ValidationBanner
                type="error"
                error={bridgeSenderError}
                variant="sender"
              />
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
  );
};
