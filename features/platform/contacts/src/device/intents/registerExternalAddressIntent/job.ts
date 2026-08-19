import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type { RegisterExternalAddressIntentInput, RegisterExternalAddressJobState } from "./types";

// WIP
export const registerExternalAddressIntentJob: Job<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput
> = ({ input }) =>
  concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({
      type: "completed" as const,
      result: {
        mode: input.existingContactGroup === undefined ? "newContactGroup" : "existingContactGroup",
        contactName: input.contactName,
        scope: input.scope,
        address: input.address,
        blockchainFamily: input.blockchainFamily,
        chainId: input.chainId,
        groupHandle: input.existingContactGroup?.groupHandle ?? stubProof("group-handle"),
        hmacProof: input.existingContactGroup?.hmacProof ?? stubProof("contact-name-proof"),
        hmacRest: stubProof("external-address-proof"),
      },
    } as const),
  );
