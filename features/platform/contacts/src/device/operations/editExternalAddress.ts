import { ExternalAddressDeviceContextSchema } from "@domain/entity-contact";
import {
  EditExternalAddressError,
  type EditExternalAddressInput,
  type EditExternalAddressResult as PortResult,
} from "../../contactDeviceIntentsPort";
import {
  editExternalAddressIntentPlatformDefinition,
  type ContactIntentResult,
  type EditExternalAddressIntentInput,
  type EditExternalAddressJobState,
  type EditExternalAddressResult,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation } from "../types";

type Result = ContactIntentResult<EditExternalAddressResult>;

function toCombinedEditPortResult(result: Result): PortResult {
  if (result.type === "failure") {
    throw new EditExternalAddressError({ cause: result.error });
  }
  return ExternalAddressDeviceContextSchema.parse({
    blockchainFamily: result.result.blockchainFamily,
    chainId: result.result.chainId,
    hmacRest: result.result.hmacRest,
  });
}

export function createEditExternalAddressOperation(
  input: EditExternalAddressInput,
): ContactOperation<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  Result,
  PortResult
> | null {
  const labelChanged = input.updatedLabel !== input.address.label;
  const addressChanged = input.updatedAddress !== input.address.address;

  if (!labelChanged && !addressChanged) {
    return null;
  }

  const credentials = input.contact.deviceCredentials;
  if (credentials === undefined) {
    throw new Error("Contact device credentials are required to edit an address");
  }

  const context = resolveContactDeviceContext(input.address.currencyId);
  return {
    intentDefinition: editExternalAddressIntentPlatformDefinition,
    intentInput: {
      contactName: input.contact.name,
      previousScope: input.address.label,
      newScope: input.updatedLabel,
      previousAddress: input.address.address,
      newAddress: input.updatedAddress,
      blockchainFamily: context.blockchainFamily,
      chainId: context.chainId,
      groupHandle: credentials.groupHandle,
      hmacProof: credentials.hmacProof,
      hmacRest: input.address.device.hmacRest,
    },
    initializationInput: context.initializationInput,
    mapIntentResultToResult: toCombinedEditPortResult,
  };
}
