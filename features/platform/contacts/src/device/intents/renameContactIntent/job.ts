import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type { RenameContactIntentInput, RenameContactJobState } from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const renameContactIntentJob: Job<RenameContactJobState, RenameContactIntentInput> = ({
  input,
}) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: {
        previousContactName: input.previousContactName,
        contactName: input.newContactName,
        groupHandle: input.groupHandle,
        hmacProof: stubProof("renamed-contact-proof"),
      },
    }),
  );
