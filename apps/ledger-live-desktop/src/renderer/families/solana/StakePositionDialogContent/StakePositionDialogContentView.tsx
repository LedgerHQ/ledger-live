import React from "react";
import {
  StakePositionDetails,
  StakePositionSurface,
  StakePositionUnavailable,
  type StakePositionDetailsProps,
  type StakePositionSurfaceProps,
} from "@features/flow-stake-position";
import { ExitTransactionStep, type ExitTransactionStepProps } from "./ExitTransactionStep";
import { ResultStep, type ResultStepProps } from "./ResultStep";

export type StakePositionDialogBody =
  | Readonly<{ kind: "loading" | "notFound"; onDismiss: () => void }>
  | Readonly<{ kind: "details"; details: StakePositionDetailsProps }>
  | Readonly<{ kind: "transaction"; transactionKey: string; transaction: ExitTransactionStepProps }>
  | Readonly<{ kind: "result"; result: ResultStepProps }>;

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
    case "details":
      return <StakePositionDetails {...body.details} />;
    case "transaction":
      return <ExitTransactionStep key={body.transactionKey} {...body.transaction} />;
    case "result":
      return <ResultStep {...body.result} />;
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
