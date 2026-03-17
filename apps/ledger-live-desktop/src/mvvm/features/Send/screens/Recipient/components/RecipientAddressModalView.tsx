import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type {
  AddressSearchResult,
  AddressValidationError as AddressValidationErrorType,
} from "@ledgerhq/live-common/flows/send/recipient/types";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import { RecipientIntroCard } from "./RecipientIntroCard";
import { ValidationBanner } from "./ValidationBanner";

type RecipientAddressModalViewProps = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  showInitialState: boolean;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  isSanctioned: boolean;
  isAddressComplete: boolean;
  addressValidationErrorType: AddressValidationErrorType | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  onAddressSelect: (address: string, ensName?: string) => void;
  hasMemo: boolean;
  hasMemoValidationError: boolean;
  hasFilledMemo: boolean;
}>;

export function RecipientAddressModalView({
  searchValue,
  isLoading,
  result,
  showInitialState,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  isSanctioned,
  isAddressComplete,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  onAddressSelect,
  hasMemo,
  hasMemoValidationError,
  hasFilledMemo,
}: RecipientAddressModalViewProps) {
  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  return (
    <DialogBody className="flex flex-col py-16 min-h-[156px]">
      {isLoading && (
        <div className="flex flex-1 items-center">
          <LoadingState />
        </div>
      )}

      {showInitialState && <RecipientIntroCard />}

      {showMatchedAddress && (!hasMemo || (hasFilledMemo && !hasMemoValidationError)) && (
        <AddressMatchedSection
          searchResult={result}
          searchValue={searchValue}
          onSelect={onAddressSelect}
          isSanctioned={isSanctioned}
          isAddressComplete={isAddressComplete}
          hasBridgeError={showBridgeRecipientError}
        />
      )}

      {showAddressValidationError && (
        <div className="flex flex-1 items-center justify-center">
          <AddressValidationError error={addressValidationErrorType} />
        </div>
      )}

      {showEmptyState && <EmptyList translationKey="newSendFlow.recentSendWillAppear" />}

      {shouldShowErrorBanner && (
        <div className="mt-6 flex flex-col gap-16">
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
            <ValidationBanner type="warning" warning={bridgeRecipientWarning} variant="recipient" />
          )}
        </div>
      )}
    </DialogBody>
  );
}
