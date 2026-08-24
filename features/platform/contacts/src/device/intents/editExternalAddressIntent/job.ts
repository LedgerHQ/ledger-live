import type { Job } from "@features/platform-device-intent";
import { from, tap } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../result";
import { stubEditedAddressHmacRest } from "../stubProof";
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
  const hmacRest = scopeChanged || addressChanged ? stubEditedAddressHmacRest : input.hmacRest;
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

  return from(states).pipe(
    tap(state => {
      if (state.type === "completed") {
        reporter.report({ type: "success", result });
      }
    }),
    reporter.cancelOnUnsubscribe(),
  );
};
