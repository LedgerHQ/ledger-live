import type { Job } from "@features/platform-device-intent";
import { concat, of, tap } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../result";
import { stubDeviceContactGroupCredentials, stubExternalAddressDeviceContext } from "../stubProof";
import type {
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
} from "./types";

// Temporary deterministic stub until the ContactsManager integration lands.
export const registerExternalAddressIntentJob: Job<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ContactIntentResult<RegisterExternalAddressResult>
> = ({ input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const result: RegisterExternalAddressResult = {
    mode: input.existingContactGroup === undefined ? "newContactGroup" : "existingContactGroup",
    contactName: input.contactName,
    scope: input.scope,
    address: input.address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle:
      input.existingContactGroup?.groupHandle ?? stubDeviceContactGroupCredentials.groupHandle,
    hmacProof: input.existingContactGroup?.hmacProof ?? stubDeviceContactGroupCredentials.hmacProof,
    hmacRest: stubExternalAddressDeviceContext.hmacRest,
  };

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    of({ type: "completed" } as const).pipe(
      tap(() => {
        reporter.report({ type: "success", result });
      }),
    ),
  ).pipe(reporter.cancelOnUnsubscribe());
};
