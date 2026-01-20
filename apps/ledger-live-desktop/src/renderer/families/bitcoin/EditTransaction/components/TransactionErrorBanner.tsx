import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";

export const TransactionErrorBanner = ({
  transactionHasBeenValidated,
  errors = {},
}: {
  transactionHasBeenValidated: boolean;
  errors?: Record<string, Error>;
}): React.JSX.Element => {
  if (transactionHasBeenValidated) {
    return <ErrorBanner error={new TransactionHasBeenValidatedError()} />;
  }

  if (Object.keys(errors).length) {
    return <ErrorBanner error={Object.values(errors)[0]} />;
  }

  return <></>;
};
