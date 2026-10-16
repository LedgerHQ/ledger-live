import { createPerpsRequest } from "../perpsRequest";
import type { PerpsWithdrawResult } from "../server";

const withdrawRequest = createPerpsRequest<PerpsWithdrawResult>();

export const beginWithdrawRequest = withdrawRequest.begin;
export const getWithdrawRequestId = withdrawRequest.getId;
export const settleWithdrawRequest = withdrawRequest.settle;
/** Call right before submitting so a later cancel never reports a refusal. */
export const markWithdrawRequestCommitted = withdrawRequest.markCommitted;
export const cancelWithdrawRequest = withdrawRequest.cancel;
