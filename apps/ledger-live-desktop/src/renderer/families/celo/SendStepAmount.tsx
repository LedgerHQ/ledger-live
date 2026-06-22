import React from "react";
import { NotEnoughBalanceFees } from "@ledgerhq/errors";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { DefaultStepAmount } from "~/renderer/modals/Send/steps/StepAmount";
import type { StepProps } from "~/renderer/modals/Send/types";

export const FEES_BANNER_TESTID = "celo-send-fees-error-banner";

const SendStepAmount = (props: StepProps) => {
  const { status, error, bridgePending } = props;
  const feesError = status.errors.fees;
  const showFeesBanner = !error && !bridgePending && feesError instanceof NotEnoughBalanceFees;

  return (
    <>
      {showFeesBanner ? <ErrorBanner error={feesError} dataTestId={FEES_BANNER_TESTID} /> : null}
      <DefaultStepAmount {...props} />
    </>
  );
};

export default SendStepAmount;
