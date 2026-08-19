import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type { RenameLedgerAccountIntentInput, RenameLedgerAccountJobState } from "./types";

// WIP
export const renameLedgerAccountIntentJob: Job<
  RenameLedgerAccountJobState,
  RenameLedgerAccountIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: {
        previousAccountName: input.previousAccountName,
        accountName: input.newAccountName,
        derivationPath: input.derivationPath,
        blockchainFamily: input.blockchainFamily,
        chainId: input.chainId,
        hmacProof: stubProof("renamed-ledger-account-proof"),
      },
    }),
  );
