import React from "react";
import {
  StakePositionDetails,
  StakePositionResult,
  StakePositionSurface,
  StakePositionUnavailable,
  type StakePositionDetailsProps,
  type StakePositionResultProps,
  type StakePositionSurfaceProps,
} from "@features/flow-stake-position";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import TranslatedError from "~/renderer/components/TranslatedError";
import { ExitTransactionStep, type ExitTransactionStepProps } from "./ExitTransactionStep";

/** The currency whose icon sits next to the account name of the details. */
export type StakePositionAccountCurrency = Readonly<{ ledgerId: string; ticker: string }>;

export type StakePositionDialogBody =
  | Readonly<{ kind: "loading" | "notFound"; onDismiss: () => void }>
  | Readonly<{ kind: "error"; onDismiss: () => void; onRetry: () => void }>
  | Readonly<{
      kind: "details";
      details: StakePositionDetailsProps;
      accountCurrency: StakePositionAccountCurrency;
    }>
  | Readonly<{ kind: "transaction"; transactionKey: string; transaction: ExitTransactionStepProps }>
  | Readonly<{
      kind: "success";
      result: Extract<StakePositionResultProps, { outcome: "success" }>;
    }>
  | Readonly<{ kind: "failure"; error: Error; isSigned: boolean; onRetry: () => void }>;

export type StakePositionDialogContentViewProps = Readonly<{
  surface: Omit<StakePositionSurfaceProps, "children">;
  body: StakePositionDialogBody;
}>;

function StakePositionDialogBodyView({ body }: Readonly<{ body: StakePositionDialogBody }>) {
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
          accountIcon={
            <SquaredCryptoIcon
              size={16}
              ledgerId={body.accountCurrency.ledgerId}
              ticker={body.accountCurrency.ticker}
            />
          }
        />
      );
    case "transaction":
      return <ExitTransactionStep key={body.transactionKey} {...body.transaction} />;
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

export function StakePositionDialogContentView({
  surface,
  body,
}: StakePositionDialogContentViewProps) {
  return (
    <StakePositionSurface {...surface}>
      <StakePositionDialogBodyView body={body} />
    </StakePositionSurface>
  );
}
