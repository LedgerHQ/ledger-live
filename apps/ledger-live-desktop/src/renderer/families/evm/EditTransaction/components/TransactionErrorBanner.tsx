import { NotEnoughGas, TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";

export const TransactionErrorBanner = ({
  transactionHasBeenValidated,
  errors = {},
}: {
  transactionHasBeenValidated: boolean;
  errors?: Record<string, Error>;
}): JSX.Element => {
  if (transactionHasBeenValidated) {
    return <ErrorBanner error={new TransactionHasBeenValidatedError()} />;
  }

  /**
   * we use an empty fragment as a fallback to avoid displaying the default
   * generic description
   */
  if (errors.gasPrice && errors.gasPrice instanceof NotEnoughGas) {
    return <ErrorBanner error={errors.gasPrice} fallback={{ description: <></> }} />;
  }

  if (Object.keys(errors).length) {
    return <ErrorBanner error={Object.values(errors)[0]} />;
  }

  return <></>;
};
