import type { Job } from "@features/platform-device-intent";
import { concat, of } from "rxjs";
import { stubProof } from "../stubProof";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
  EditExternalAddressStep,
} from "./types";

function editResult(
  input: EditExternalAddressIntentInput,
  proofStep: EditExternalAddressStep,
  scope: string,
  address: string,
): EditExternalAddressResult {
  return {
    contactName: input.contactName,
    scope,
    address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest: stubProof(`${proofStep}-proof`),
  };
}

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressIntentJob: Job<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput
> = ({ input }) => {
  const identifierResult = editResult(input, "identifier", input.previousScope, input.newAddress);
  const scopeResult = editResult(input, "scope", input.newScope, input.newAddress);

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" as const, step: "identifier" as const }),
    of({ type: "partial-result" as const, result: identifierResult }),
    of({ type: "awaiting-device-confirmation" as const, step: "scope" as const }),
    of({
      type: "completed" as const,
      appliedSteps: ["identifier", "scope"] as const,
      result: scopeResult,
    } as const),
  );
};
