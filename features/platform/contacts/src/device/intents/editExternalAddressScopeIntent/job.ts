import type { Job } from "@features/platform-device-intent";
import { concat, of, tap } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../result";
import { stubProof } from "../stubProof";
import type {
  EditExternalAddressScopeIntentInput,
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeResult,
} from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressScopeIntentJob: Job<
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeIntentInput,
  ContactIntentResult<EditExternalAddressScopeResult>
> = ({ input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const result: EditExternalAddressScopeResult = {
    contactName: input.contactName,
    previousScope: input.previousScope,
    scope: input.newScope,
    address: input.address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest: stubProof("scope-proof"),
  };

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({ type: "completed" } as const).pipe(
      tap(() => {
        reporter.report({ type: "success", result });
      }),
    ),
  ).pipe(reporter.cancelOnUnsubscribe());
};
