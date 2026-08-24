import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type {
  EditExternalAddressIdentifierIntentInput,
  EditExternalAddressIdentifierJobState,
} from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressIdentifierIntentJob: Job<
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: {
        contactName: input.contactName,
        scope: input.scope,
        previousAddress: input.previousAddress,
        address: input.newAddress,
        blockchainFamily: input.blockchainFamily,
        chainId: input.chainId,
        groupHandle: input.groupHandle,
        hmacProof: input.hmacProof,
        hmacRest: stubProof("identifier-proof"),
      },
    }),
  );
