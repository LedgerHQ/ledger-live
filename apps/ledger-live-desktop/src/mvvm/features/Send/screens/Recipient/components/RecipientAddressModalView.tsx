import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import type { AddressValidationError as AddressValidationErrorType } from "@ledgerhq/live-common/flows/send/recipient/types";
import { shouldShowMatchedAddress } from "@ledgerhq/live-common/flows/send/recipient/utils/shouldShowMatchedAddress";
import type { AddressMatchedSectionViewModel } from "../hooks/useAddressMatchedSectionViewModel";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import { RecipientEmptyContactsState } from "./RecipientEmptyContactsState";
import { RecipientIntroCard } from "./RecipientIntroCard";
import { ValidationBanner } from "./ValidationBanner";

type RecipientAddressModalViewProps = Readonly<{
  isLoading: boolean;
  showInitialState: boolean;
  showEmptyContactsState: boolean;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  isAddressComplete: boolean;
  addressValidationErrorType: AddressValidationErrorType | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  hasMemo: boolean;
  hasMemoValidationError: boolean;
  hasFilledMemo: boolean;
  addressMatchedSectionViewModel: AddressMatchedSectionViewModel;
}>;

export function RecipientAddressModalView({
  isLoading,
  showInitialState,
  showEmptyContactsState,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  isAddressComplete,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  hasMemo,
  hasMemoValidationError,
  hasFilledMemo,
  addressMatchedSectionViewModel,
}: RecipientAddressModalViewProps) {
  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  const isWaitingForMemo = hasMemo && isAddressComplete && !hasFilledMemo;
  const showMatched = shouldShowMatchedAddress({
    showMatchedAddress,
    hasMemo,
    hasFilledMemo,
    hasMemoError: hasMemoValidationError,
  });

  return (
    <DialogBody className={cn("flex flex-col py-16", !isWaitingForMemo && "min-h-[156px]")}>
      {isLoading && !showMatched && (
        <div className="flex flex-1 items-center">
          <LoadingState />
        </div>
      )}

      {showInitialState && showEmptyContactsState && <RecipientEmptyContactsState />}

      {showInitialState && !showEmptyContactsState && <RecipientIntroCard />}

      {showMatched && <AddressMatchedSection viewModel={addressMatchedSectionViewModel} />}

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
