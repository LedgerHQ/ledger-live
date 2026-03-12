import React from "react";
import { SharedFooterContinueButton } from "./SharedFooterContinueButton";

type TransactionErrorBannerProps = {
  transactionHasBeenValidated: boolean;
  errors?: Record<string, Error>;
};

type Props = {
  transactionHasBeenValidated: boolean;
  bridgePending: boolean;
  errors: Record<string, Error>;
  onContinue: () => void;
  TransactionErrorBanner: React.ComponentType<TransactionErrorBannerProps>;
};

export const SharedStepSummaryFooter = ({
  transactionHasBeenValidated,
  bridgePending,
  errors,
  onContinue,
  TransactionErrorBanner,
}: Props) => {
  const hasErrors = !!Object.keys(errors).length;
  const disabled = bridgePending || hasErrors || transactionHasBeenValidated;

  return (
    <>
      <TransactionErrorBanner
        transactionHasBeenValidated={transactionHasBeenValidated}
        errors={errors}
      />
      <SharedFooterContinueButton
        id={"send-summary-continue-button"}
        disabled={disabled}
        onClick={onContinue}
      />
    </>
  );
};
