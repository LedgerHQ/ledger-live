import React, { Suspense } from "react";
import {
  StakePositionConfirm,
  StakePositionDetails,
  StakePositionSurface,
  StakePositionUnavailable,
} from "@features/flow-stake-position";
import { ExitTransactionConfirm } from "./ExitTransactionConfirm";
import type {
  SolanaStakePositionSheetBody,
  SolanaStakePositionSheetViewModel,
} from "./useSolanaStakePositionSheetViewModel";

const STAKE_POSITION_SHEET_TEST_ID = "stake-position-sheet";

function SheetBody({
  body,
  onDismiss,
}: Readonly<{ body: SolanaStakePositionSheetBody; onDismiss: () => void }>) {
  switch (body.kind) {
    case "unavailable":
      return (
        <StakePositionUnavailable
          reason={body.reason}
          onDismiss={onDismiss}
          testID={`${STAKE_POSITION_SHEET_TEST_ID}-${body.reason}`}
        />
      );
    case "details":
      return <StakePositionDetails {...body.details} />;
    case "confirm":
      return (
        <Suspense fallback={<StakePositionConfirm {...body.preparing} />}>
          <ExitTransactionConfirm {...body.confirm} />
        </Suspense>
      );
  }
}

export function StakePositionSheetView({
  isOpen,
  heading,
  ticker,
  onBack,
  onDismiss,
  body,
}: SolanaStakePositionSheetViewModel) {
  return (
    <StakePositionSurface
      isOpen={isOpen}
      heading={heading}
      ticker={ticker}
      onBack={onBack}
      onDismiss={onDismiss}
      isDismissible
      testID={STAKE_POSITION_SHEET_TEST_ID}
    >
      <SheetBody body={body} onDismiss={onDismiss} />
    </StakePositionSurface>
  );
}
