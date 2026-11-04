import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Device } from "../../../hw/actions/types";
import type { PerpsWithdrawResult } from "../server";
import { submitWithdraw } from "./api";
import {
  WithdrawApiError,
  WithdrawSignerMismatchError,
  WithdrawUnsupportedRouteError,
} from "./errors";
import type { WithdrawQuote } from "./quote";
import {
  markWithdrawRequestCommitted,
  rejectWithdrawRequest,
  settleWithdrawRequest,
} from "./request";
import { getWithdrawTypedData, signWithdrawTypedData } from "./sign";

export type PerpsWithdrawExecutionParams = Readonly<{
  /** The withdraw request perps-live-app awaits, from `getWithdrawRequestId`. */
  requestId: string | null;
  device: Device;
  /** The HyperCore account, a main account. */
  sourceAccount: AccountLike;
  quote: WithdrawQuote;
  /** What perps-live-app is told besides the swap id. */
  result: Omit<PerpsWithdrawResult, "swapId">;
  /** Called once the device signed, while the withdraw is being submitted. */
  onSigned?: () => void;
}>;

/**
 * Signs the quoted withdraw on the device, then submits the payload unmodified.
 * A device error leaves the request pending, so signing can be retried. A failed
 * submit rejects it and is never retried, as a 502 may still go through.
 */
export async function executePerpsWithdraw({
  requestId,
  device,
  sourceAccount,
  quote,
  result,
  onSigned,
}: PerpsWithdrawExecutionParams): Promise<PerpsWithdrawResult> {
  if (sourceAccount.type !== "Account") {
    throw new WithdrawUnsupportedRouteError("The withdraw source must be a main account");
  }
  if (!quote.payload) throw new WithdrawApiError("The withdraw quote has nothing to sign");
  const { payload } = quote;

  const signature = await signWithdrawTypedData(
    device,
    sourceAccount,
    getWithdrawTypedData(payload),
  );

  onSigned?.();
  // The user may have left while the device was signing: then nothing is submitted.
  if (!markWithdrawRequestCommitted(requestId)) throw new UserRefusedOnDevice();
  let swapId: string;
  try {
    ({ swapId } = await submitWithdraw({ payload, signature }));
  } catch (error) {
    const submitError = error instanceof Error ? error : new Error(String(error));
    rejectWithdrawRequest(requestId, submitError);
    throw submitError;
  }

  const withdrawResult = { ...result, swapId };
  settleWithdrawRequest(requestId, withdrawResult);
  return withdrawResult;
}

/**
 * Only device errors can be retried. A quote or submit error, or a payload that can never be
 * signed, would fail the same way again.
 */
export function isPerpsWithdrawRetryable(error: unknown): boolean {
  return !(
    error instanceof WithdrawApiError ||
    error instanceof WithdrawUnsupportedRouteError ||
    error instanceof WithdrawSignerMismatchError
  );
}
