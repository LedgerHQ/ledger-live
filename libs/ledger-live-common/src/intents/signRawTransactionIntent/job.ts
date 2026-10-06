import type { Job } from "@features/platform-device-intent";
import { createSignOperationJob } from "../signTransactionIntent/createSignOperationJob";
import type { SignRawTransactionIntentInput, SignRawTransactionIntentJobState } from "./types";

export const signRawTransactionIntentJob: Job<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput
> = createSignOperationJob<SignRawTransactionIntentInput>({
  getRefusalCurrency: mainAccount => mainAccount.currency,
  sign: ({ bridge, mainAccount, input, deviceId, deviceModelId }) =>
    bridge.signRawOperation({
      account: mainAccount,
      transaction: input.transaction,
      deviceId,
      deviceModelId,
    }),
});
