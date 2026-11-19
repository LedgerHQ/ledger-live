import React, { Suspense } from "react";
import {
  StakePositionConfirm,
  StakePositionDetails,
  StakePositionResult,
  StakePositionSurface,
  StakePositionUnavailable,
} from "@features/flow-stake-position";
import { StakePositionProcessing } from "LLM/features/StakePosition/signature";
import CurrencyIcon from "~/components/CurrencyIcon";
import TranslatedError from "~/components/TranslatedError";
import { ExitTransaction } from "./ExitTransaction";
import type {
  SolanaStakePositionSheetBody,
  SolanaStakePositionSheetViewModel,
} from "./useSolanaStakePositionSheetViewModel";

function SheetBody({ body }: Readonly<{ body: SolanaStakePositionSheetBody }>) {
  switch (body.kind) {
    case "loading":
    case "notFound":
      return (
        <StakePositionUnavailable
          reason={body.kind}
          onDismiss={body.onDismiss}
          testID="stake-position-unavailable"
        />
      );
    case "error":
      return (
        <StakePositionUnavailable
          reason="error"
          onDismiss={body.onDismiss}
          onRetry={body.onRetry}
          testID="stake-position-unavailable"
        />
      );
    case "details":
      return (
        <StakePositionDetails
          {...body.details}
          accountIcon={<CurrencyIcon currency={body.currency} size={16} squared />}
        />
      );
    case "confirm":
      return (
        <StakePositionConfirm
          {...body.confirm}
          errorContent={body.error ? <TranslatedError error={body.error} /> : undefined}
        />
      );
    case "processing":
      return <StakePositionProcessing testID="stake-position-broadcasting" />;
    case "success":
      return <StakePositionResult {...body.result} />;
    case "failure":
      return (
        <StakePositionResult
          outcome="failure"
          errorDescription={<TranslatedError error={body.error} field="description" />}
          isSigned={body.isSigned}
          onRetry={body.onRetry}
          testID="stake-position-failure"
        />
      );
  }
}

export function StakePositionSheetView({
  surface,
  body,
  exitTransaction,
}: SolanaStakePositionSheetViewModel) {
  return (
    <>
      <StakePositionSurface {...surface}>
        <SheetBody body={body} />
      </StakePositionSurface>
      {exitTransaction ? (
        <Suspense fallback={null}>
          <ExitTransaction key={exitTransaction.transactionKey} {...exitTransaction} />
        </Suspense>
      ) : null}
    </>
  );
}
