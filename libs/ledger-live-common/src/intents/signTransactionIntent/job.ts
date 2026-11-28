import type { Job } from "@features/platform-device-intent";
import type { SignedOperation } from "@ledgerhq/types-live";
import {
  createSignOperationJob,
  createSignOperationJobWithResult,
  type CreateSignOperationJobParams,
} from "./createSignOperationJob";
import type {
  SignTransactionIntentInput,
  SignTransactionIntentJobState,
  SignTransactionIntentWithResultJobState,
} from "./types";

const signTransactionParams: CreateSignOperationJobParams<SignTransactionIntentInput> = {
  getRefusalCurrency: (mainAccount, input) => input.tokenCurrency ?? mainAccount.currency,
  sign: ({ bridge, mainAccount, input, deviceId, deviceModelId }) =>
    bridge.signOperation({
      account: mainAccount,
      transaction: input.transaction,
      deviceId,
      deviceModelId,
    }),
};

export const signTransactionIntentJob: Job<
  SignTransactionIntentJobState,
  SignTransactionIntentInput
> = createSignOperationJob(signTransactionParams);

export const signTransactionIntentJobWithResult: Job<
  SignTransactionIntentWithResultJobState,
  SignTransactionIntentInput,
  SignedOperation
> = createSignOperationJobWithResult(signTransactionParams);
