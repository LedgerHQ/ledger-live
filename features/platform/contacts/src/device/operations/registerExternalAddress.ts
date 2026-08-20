import {
  DeviceContactGroupCredentialsSchema,
  ExternalAddressDeviceContextSchema,
} from "@domain/entity-contact";
import type {
  RegisterExternalAddressInput,
  RegisterExternalAddressResult,
} from "../../contactDeviceIntentsPort";
import {
  registerExternalAddressIntentPlatformDefinition,
  type RegisterExternalAddressIntentInput,
  type RegisterExternalAddressJobState,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation, ContactOperationOutcome } from "../types";

function classifyRegisterExternalAddress(
  state: RegisterExternalAddressJobState,
): ContactOperationOutcome<RegisterExternalAddressResult> {
  switch (state.type) {
    case "completed":
      return {
        type: "success",
        result: {
          deviceCredentials: DeviceContactGroupCredentialsSchema.parse({
            groupHandle: state.result.groupHandle,
            hmacProof: state.result.hmacProof,
          }),
          addressDeviceContext: ExternalAddressDeviceContextSchema.parse({
            blockchainFamily: state.result.blockchainFamily,
            chainId: state.result.chainId,
            hmacRest: state.result.hmacRest,
          }),
        },
      };
    case "failed":
      return { type: "failure", error: state.error };
    case "pending":
    case "awaiting-device-confirmation":
      return { type: "pending" };
  }
}

export function createRegisterExternalAddressOperation(
  input: RegisterExternalAddressInput,
): ContactOperation<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressResult
> {
  const context = resolveContactDeviceContext(input.currencyId);

  return {
    definition: registerExternalAddressIntentPlatformDefinition,
    input: {
      contactName: input.contact.name,
      scope: input.label,
      address: input.address,
      blockchainFamily: context.blockchainFamily,
      chainId: context.chainId,
      ...(input.contact.deviceCredentials === undefined
        ? {}
        : { existingContactGroup: input.contact.deviceCredentials }),
    },
    initializationInput: context.initializationInput,
    classify: classifyRegisterExternalAddress,
  };
}
