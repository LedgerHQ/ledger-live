import type { Job } from "@features/platform-device-intent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { defer, mergeMap, tap } from "rxjs";
import { withLiveAppContext } from "../../wallet-api/blindSigningContext";
import { createSignOperationJob } from "../signTransactionIntent/createSignOperationJob";
import type { SignRawTransactionIntentInput, SignRawTransactionIntentJobState } from "./types";

const signRawOperationJob = createSignOperationJob<SignRawTransactionIntentInput>({
  getRefusalCurrency: mainAccount => mainAccount.currency,
  sign: ({ bridge, mainAccount, input, deviceId, deviceModelId }) => {
    const { manifestId } = input;
    const signRawOperation = () =>
      bridge.signRawOperation({
        account: mainAccount,
        transaction: input.transaction,
        deviceId,
        deviceModelId,
        broadcast: input.broadcast,
      });
    // The bridge attributes the transaction events to the live app current when it is called.
    // Scoping each call, retries included, keeps them on this request's live app while other
    // requests wait in a queue.
    return manifestId
      ? defer(() => withLiveAppContext({ id: manifestId }, async () => signRawOperation())).pipe(
          mergeMap(events => events),
        )
      : signRawOperation();
  },
});

/** Also reports the signed operation as the job's result, for callers that act once the job ends. */
export const signRawTransactionIntentJob: Job<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput,
  SignedOperation
> = ({ onResult, ...jobInput }) =>
  signRawOperationJob({ ...jobInput, onResult: () => undefined }).pipe(
    tap(state => {
      if (state.type === "signed") onResult(state.signedOperation);
    }),
  );
