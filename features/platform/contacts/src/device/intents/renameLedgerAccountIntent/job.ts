import type { Job } from "@features/platform-device-intent";
import { concat, ignoreElements, of, timer } from "rxjs";
import type { RenameLedgerAccountIntentInput, RenameLedgerAccountJobState } from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const renameLedgerAccountIntentJob: Job<
  RenameLedgerAccountJobState,
  RenameLedgerAccountIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    timer(2_000).pipe(ignoreElements()),
    of({
      type: "completed" as const,
      result: {
        previousAccountName: input.previousAccountName,
        accountName: input.newAccountName,
        derivationPath: input.derivationPath,
        blockchainFamily: input.blockchainFamily,
        chainId: input.chainId,
        hmacProof: "contacts-die-stub-renamed-ledger-account-proof",
      },
    }),
  );
