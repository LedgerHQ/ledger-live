import type { Job } from "@features/platform-device-intent";
import { concat, ignoreElements, of, tap, timer } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import { stubRenamedContactHmacProof } from "../stubProof";
import type { RenameContactIntentInput, RenameContactJobState, RenameContactResult } from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const renameContactIntentJob: Job<
  RenameContactJobState,
  RenameContactIntentInput,
  ContactIntentResult<RenameContactResult>
> = ({ input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const result: RenameContactResult = {
    previousContactName: input.previousContactName,
    contactName: input.newContactName,
    groupHandle: input.groupHandle,
    hmacProof: stubRenamedContactHmacProof,
  };

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    timer(2_000).pipe(ignoreElements()),
    of({ type: "completed" } as const).pipe(
      tap(() => {
        reporter.report({ type: "success", result });
      }),
    ),
  ).pipe(reporter.cancelOnUnsubscribe());
};
