import { TransportStatusError } from "@ledgerhq/errors";
import { getExchangeErrorMessage } from "@ledgerhq/hw-app-exchange";

export type CompleteExchangeStep =
  | "INIT"
  | "SET_PARTNER_KEY"
  | "CHECK_PARTNER"
  | "PROCESS_TRANSACTION"
  | "CHECK_TRANSACTION_SIGNATURE"
  | "CHECK_PAYOUT_ADDRESS"
  | "CHECK_REFUND_ADDRESS"
  | "SIGN_COIN_TRANSACTION";

export class CompleteExchangeError extends Error {
  step: CompleteExchangeStep;
  title?: string;

  constructor(step: CompleteExchangeStep, title?: string, message?: string) {
    super(message);
    this.name = "CompleteExchangeError";
    this.title = title;
    this.step = step;
  }
}

export function convertTransportError(
  step: CompleteExchangeStep,
  err: unknown,
): CompleteExchangeError | unknown {
  if (err instanceof TransportStatusError) {
    const { errorName, errorMessage } = getExchangeErrorMessage(err.statusCode, step);
    return new CompleteExchangeError(step, errorName, errorMessage);
  }
  return err;
}

export function getSwapStepFromError(error: Error): string {
  if ((error as CompleteExchangeError).step) {
    return (error as CompleteExchangeError).step;
  } else if (error.name === "DisabledTransactionBroadcastError") {
    return "SIGN_COIN_TRANSACTION";
  }

  return "UNKNOWN_STEP";
}
