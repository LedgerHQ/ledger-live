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
  type RegisterExternalAddressResult as IntentResult,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation } from "../types";
import type { IntentPlatformDefinition } from "@features/platform-device-intent";

type IntentOutcome = ContactIntentResult<IntentResult>;

function mapIntentResultToResult(outcome: IntentOutcome): PortResult {
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
    IntentOutcome
  >,
): ContactOperation<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  IntentOutcome,
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
