import type { Job } from "@features/platform-device-intent";
import { ExternalAddressProofSchema } from "@domain/entity-contact";
import { concat, ignoreElements, of, tap, timer } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "./types";

function editResult(
  input: EditExternalAddressIntentInput,
  scope: string,
  address: string,
  hmacRest: string,
): EditExternalAddressResult {
  return {
    contactName: input.contactName,
    scope,
    address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest,
  };
}

// Temporary deterministic stub until the ContactsManager integration lands.
export const editExternalAddressIntentJob: Job<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ContactIntentResult<EditExternalAddressResult>
> = ({ input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const addressChanged = input.previousAddress !== input.newAddress;
  const scopeChanged = input.previousScope !== input.newScope;
  const hmacRest =
    scopeChanged || addressChanged
      ? ExternalAddressProofSchema.parse("mock-external-address-proof-after-scope-edit")
      : input.hmacRest;
  const result = editResult(input, input.newScope, input.newAddress, hmacRest);
  const states: EditExternalAddressJobState[] = [{ type: "pending" }];

  if (addressChanged) {
    states.push({ type: "awaiting-device-confirmation", step: "identifier" });
    if (scopeChanged) {
      states.push({ type: "partial-result" });
    }
  }
  if (scopeChanged) {
    states.push({ type: "awaiting-device-confirmation", step: "scope" });
  }
  states.push({ type: "completed" });

  return concat(
    ...states.map(state =>
      state.type === "awaiting-device-confirmation"
        ? concat(of(state), timer(2_000).pipe(ignoreElements()))
        : of(state),
    ),
  ).pipe(
    tap(state => {
      if (state.type === "completed") {
        reporter.report({ type: "success", result });
      }
    }),
    reporter.cancelOnUnsubscribe(),
  );
};
