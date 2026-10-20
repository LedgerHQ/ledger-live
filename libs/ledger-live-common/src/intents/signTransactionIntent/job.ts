import type { Job } from "@features/platform-device-intent";
import { createSignOperationJob } from "./createSignOperationJob";
import type { SignTransactionIntentInput, SignTransactionIntentJobState } from "./types";

export const signTransactionIntentJob: Job<
  SignTransactionIntentJobState,
  SignTransactionIntentInput
> = createSignOperationJob<SignTransactionIntentInput>({
  getRefusalCurrency: (mainAccount, input) => input.tokenCurrency ?? mainAccount.currency,
  sign: ({ bridge, mainAccount, input, deviceId, deviceModelId }) =>
    bridge.signOperation({
      account: mainAccount,
      transaction: input.transaction,
      deviceId,
      deviceModelId,
    }),
});
