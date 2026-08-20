import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type { RegisterLedgerAccountIntentInput, RegisterLedgerAccountJobState } from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const registerLedgerAccountIntentJob: Job<
  RegisterLedgerAccountJobState,
  RegisterLedgerAccountIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: { ...input, hmacProof: stubProof("ledger-account-proof") },
    }),
  );
