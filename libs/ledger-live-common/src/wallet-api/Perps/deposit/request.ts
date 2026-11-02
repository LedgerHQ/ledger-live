import { createPerpsRequest } from "../perpsRequest";
import type { PerpsDepositResult } from "../server";

const depositRequest = createPerpsRequest<PerpsDepositResult>();

export const beginDepositRequest = depositRequest.begin;
export const getDepositRequestId = depositRequest.getId;
export const settleDepositRequest = depositRequest.settle;
export const cancelDepositRequest = depositRequest.cancel;
