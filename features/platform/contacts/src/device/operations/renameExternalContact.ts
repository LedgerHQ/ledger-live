import { DeviceContactGroupCredentialsSchema } from "@domain/entity-contact";
import type {
  RenameExternalContactInput,
  RenameExternalContactResult,
} from "../../contactDeviceIntentsPort";
import {
  renameContactIntentPlatformDefinition,
  type RenameContactIntentInput,
  type RenameContactJobState,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation, ContactOperationOutcome } from "../types";

function classifyRenameExternalContact(
  state: RenameContactJobState,
): ContactOperationOutcome<RenameExternalContactResult> {
  switch (state.type) {
    case "completed":
      return {
        type: "success",
        result: DeviceContactGroupCredentialsSchema.parse({
          groupHandle: state.result.groupHandle,
          hmacProof: state.result.hmacProof,
        }),
      };
    case "failed":
      return { type: "failure", error: state.error };
    case "pending":
    case "awaiting-device-confirmation":
      return { type: "pending" };
  }
}

export function createRenameExternalContactOperation(
  input: RenameExternalContactInput,
): ContactOperation<RenameContactJobState, RenameContactIntentInput, RenameExternalContactResult> {
  const address = input.contact.addresses[0];
  const credentials = input.contact.deviceCredentials;

  if (address === undefined || credentials === undefined) {
    throw new Error("A contact with device credentials and an address is required");
  }

  return {
    definition: renameContactIntentPlatformDefinition,
    input: {
      previousContactName: input.contact.name,
      newContactName: input.name,
      groupHandle: credentials.groupHandle,
      hmacProof: credentials.hmacProof,
    },
    initializationInput: resolveContactDeviceContext(address.currencyId).initializationInput,
    classify: classifyRenameExternalContact,
  };
}
