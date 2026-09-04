import {
  DeviceContactGroupCredentialsSchema,
  ExternalAddressDeviceContextSchema,
} from "@domain/entity-contact";
import type {
  RegisterExternalAddressInput,
  RegisterExternalAddressResult as PortResult,
} from "../../contactDeviceIntentsPort";
import {
  type ContactIntentResult,
  type RegisterExternalAddressIntentInput,
  type RegisterExternalAddressJobState,
  type RegisterExternalAddressResult as RegisterExternalAddressIntentResult,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation } from "../types";
import type { IntentPlatformDefinition } from "@features/platform-device-intent";

type IntentResult = ContactIntentResult<RegisterExternalAddressIntentResult>;

function mapIntentResultToResult(outcome: IntentResult): PortResult {
  if (outcome.type === "failure") {
    throw outcome.error;
  }
  const { result } = outcome;
  return {
    deviceCredentials: DeviceContactGroupCredentialsSchema.parse({
      groupHandle: result.groupHandle,
      hmacProof: result.hmacProof,
    }),
    addressDeviceContext: ExternalAddressDeviceContextSchema.parse({
      blockchainFamily: result.blockchainFamily,
      chainId: result.chainId,
      hmacRest: result.hmacRest,
    }),
  };
}

export function createRegisterExternalAddressOperation(
  input: RegisterExternalAddressInput,
  intentDefinition: IntentPlatformDefinition<
    RegisterExternalAddressJobState,
    RegisterExternalAddressIntentInput,
    undefined,
    IntentResult
  >,
): ContactOperation<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  IntentResult,
  PortResult
> {
  const context = resolveContactDeviceContext(input.currencyId);

  return {
    intentDefinition,
    intentInput: {
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
    mapIntentResultToResult,
  };
}
