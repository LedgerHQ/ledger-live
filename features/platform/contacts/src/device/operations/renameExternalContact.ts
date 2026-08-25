import { DeviceContactGroupCredentialsSchema } from "@domain/entity-contact";
import type {
  RenameExternalContactInput,
  RenameExternalContactResult,
} from "../../contactDeviceIntentsPort";
import {
  type ContactIntentResult,
  type RenameContactIntentInput,
  type RenameContactJobState,
  type RenameContactResult,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation } from "../types";
import type { IntentPlatformDefinition } from "@features/platform-device-intent";

type IntentOutcome = ContactIntentResult<RenameContactResult>;

function mapIntentResultToResult(outcome: IntentOutcome): RenameExternalContactResult {
  if (outcome.type === "failure") {
    throw outcome.error;
  }
  const { result } = outcome;
  return DeviceContactGroupCredentialsSchema.parse({
    groupHandle: result.groupHandle,
    hmacProof: result.hmacProof,
  });
}

export function createRenameExternalContactOperation(
  input: RenameExternalContactInput,
  intentDefinition: IntentPlatformDefinition<
    RenameContactJobState,
    RenameContactIntentInput,
    undefined,
    IntentOutcome
  >,
): ContactOperation<
  RenameContactJobState,
  RenameContactIntentInput,
  IntentOutcome,
  RenameExternalContactResult
> {
  const address = input.contact.addresses[0];
  const credentials = input.contact.deviceCredentials;

  if (address === undefined || credentials === undefined) {
    throw new Error("A contact with device credentials and an address is required");
  }

  return {
    intentDefinition,
    intentInput: {
      previousContactName: input.contact.name,
      newContactName: input.name,
      groupHandle: credentials.groupHandle,
      hmacProof: credentials.hmacProof,
    },
    initializationInput: resolveContactDeviceContext(address.currencyId).initializationInput,
    mapIntentResultToResult,
  };
}
