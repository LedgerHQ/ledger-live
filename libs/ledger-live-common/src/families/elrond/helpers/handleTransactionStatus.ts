import type { TransactionStatus } from "../types";

/*
 * Declare the type for the return payload of the transaction status handler.
 */

export interface handleTransactionStatusType {
  warning: Error | false;
  error: Error | false;
}

/*
 * Return an object, of the function, with the error and warning keys, as boolean values.
 */

export const handleTransactionStatus = (
  status: TransactionStatus
): handleTransactionStatusType => {
  const [[warning], [error]] = [
    Object.keys(status.warnings || {}),
    Object.keys(status.errors || {}),
  ];

  return {
    warning: status.warnings[warning],
    error: status.errors[error],
  };
};
