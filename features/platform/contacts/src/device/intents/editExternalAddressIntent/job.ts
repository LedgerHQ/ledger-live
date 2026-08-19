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
  appliedStep: EditExternalAddressStep,
  scope: string,
  address: string,
): EditExternalAddressResult {
  return {
    appliedStep,
    contactName: input.contactName,
    scope,
    address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest: stubProof(`${appliedStep}-proof`),
  };
}

// WIP
export const editExternalAddressIntentJob: Job<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput
> = ({ input }) => {
  const editsIdentifier = input.previousAddress !== input.newAddress;
  const editsScope = input.previousScope !== input.newScope;
  const identifierResult = editResult(input, "identifier", input.previousScope, input.newAddress);
  const scopeResult = editResult(input, "scope", input.newScope, input.newAddress);

  if (editsIdentifier && editsScope) {
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
  }

  const appliedStep = editsIdentifier ? "identifier" : "scope";
  const result = editsIdentifier
    ? identifierResult
    : editResult(input, "scope", input.newScope, input.previousAddress);

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" as const, step: appliedStep } as const),
    of({ type: "completed" as const, appliedSteps: [appliedStep], result } as const),
  );
};
