import type { Job } from "@features/platform-device-intent";
import { concat, ignoreElements, of, timer } from "rxjs";
import type { RegisterLedgerAccountIntentInput, RegisterLedgerAccountJobState } from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const registerLedgerAccountIntentJob: Job<
  RegisterLedgerAccountJobState,
  RegisterLedgerAccountIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    timer(2_000).pipe(ignoreElements()),
    of({
      type: "completed" as const,
      result: { ...input, hmacProof: "contacts-die-stub-ledger-account-proof" },
    }),
  );
