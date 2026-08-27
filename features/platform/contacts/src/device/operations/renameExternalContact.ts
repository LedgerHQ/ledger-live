import { DeviceContactGroupCredentialsSchema } from "@domain/entity-contact";
import type {
  RenameExternalContactInput,
  RenameExternalContactResult,
} from "../../contactDeviceIntentsPort";
import {
  type ContactIntentResult,
  type RenameContactIntentInput,
  type RenameContactJobState,
  type RenameContactResult as RenameContactIntentResult,
} from "../intents";
import { CONTACTS_DASHBOARD_INITIALIZATION_INPUT } from "../resolveContactDeviceContext";
import type { ContactOperation } from "../types";
import type { IntentPlatformDefinition } from "@features/platform-device-intent";

type IntentResult = ContactIntentResult<RenameContactIntentResult>;

function mapIntentResultToResult(outcome: IntentResult): RenameExternalContactResult {
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
    IntentResult
  >,
): ContactOperation<
  RenameContactJobState,
  RenameContactIntentInput,
  IntentResult,
  RenameExternalContactResult
> {
  const credentials = input.contact.deviceCredentials;

  // Rename is name-only and blockchain-agnostic: the group's own credentials are
  // the whole input, so a contact with no address is still renameable.
  if (credentials === undefined) {
    throw new Error("A contact with device credentials is required");
  }

  return {
    intentDefinition,
    intentInput: {
      previousContactName: input.contact.name,
      newContactName: input.name,
      groupHandle: credentials.groupHandle,
      hmacProof: credentials.hmacProof,
    },
    initializationInput: CONTACTS_DASHBOARD_INITIALIZATION_INPUT,
    mapIntentResultToResult,
  };
}
