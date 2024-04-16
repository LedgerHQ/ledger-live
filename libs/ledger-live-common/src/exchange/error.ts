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

  constructor(step: CompleteExchangeStep, message?: string) {
    super(message);
    this.name = "CompleteExchangeError";
    this.step = step;
  }
}

export function convertTransportError(
  step: CompleteExchangeStep,
  err: unknown,
): CompleteExchangeError | unknown {
  if (err instanceof TransportStatusError) {
    const errorMessage = getExchangeErrorMessage(err.statusCode, step);
    return new CompleteExchangeError(step, errorMessage);
  }
  return err;
}
