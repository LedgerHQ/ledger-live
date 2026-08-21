import type { Job } from "@features/platform-device-intent";
import { concat, of, tap } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../result";
import { stubProof } from "../stubProof";
import type {
  EditExternalAddressIdentifierIntentInput,
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierResult,
} from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressIdentifierIntentJob: Job<
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierIntentInput,
  ContactIntentResult<EditExternalAddressIdentifierResult>
> = ({ input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const result: EditExternalAddressIdentifierResult = {
    contactName: input.contactName,
    scope: input.scope,
    previousAddress: input.previousAddress,
    address: input.newAddress,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest: stubProof("identifier-proof"),
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
