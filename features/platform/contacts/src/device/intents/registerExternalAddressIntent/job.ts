import type { Job } from "@features/platform-device-intent";
import {
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";
import { concat, ignoreElements, of, tap, timer } from "rxjs";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
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
  const deviceContactGroupCredentials = mockDeviceContactGroupCredentials();
  const externalAddressDeviceContext = mockExternalAddressDeviceContext();
  const result: RegisterExternalAddressResult = {
    mode: input.existingContactGroup === undefined ? "newContactGroup" : "existingContactGroup",
    contactName: input.contactName,
    scope: input.scope,
    address: input.address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle:
      input.existingContactGroup?.groupHandle ?? deviceContactGroupCredentials.groupHandle,
    hmacProof: input.existingContactGroup?.hmacProof ?? deviceContactGroupCredentials.hmacProof,
    hmacRest: externalAddressDeviceContext.hmacRest,
  };

  return concat(
    of({ type: "pending" } as const),
    of({ type: "awaiting-device-confirmation" } as const),
    timer(2_000).pipe(ignoreElements()),
    of({ type: "completed" } as const).pipe(
      tap(() => {
        reporter.report({ type: "success", result });
      }),
    ),
  ).pipe(reporter.cancelOnUnsubscribe());
};
