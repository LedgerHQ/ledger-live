import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type {
  EditExternalAddressScopeIntentInput,
  EditExternalAddressScopeJobState,
} from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressScopeIntentJob: Job<
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: {
        contactName: input.contactName,
        previousScope: input.previousScope,
        scope: input.newScope,
        address: input.address,
        blockchainFamily: input.blockchainFamily,
        chainId: input.chainId,
        groupHandle: input.groupHandle,
        hmacProof: input.hmacProof,
        hmacRest: stubProof("scope-proof"),
      },
    }),
  );
