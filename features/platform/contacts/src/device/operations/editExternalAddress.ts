import { ExternalAddressDeviceContextSchema } from "@domain/entity-contact";
import {
  EditExternalAddressError,
  type EditExternalAddressInput,
  type EditExternalAddressResult as PortResult,
} from "../../contactDeviceIntentsPort";
import {
  editExternalAddressIdentifierIntentPlatformDefinition,
  editExternalAddressIntentPlatformDefinition,
  editExternalAddressScopeIntentPlatformDefinition,
  type EditExternalAddressIdentifierIntentInput,
  type EditExternalAddressIdentifierJobState,
  type EditExternalAddressIntentInput,
  type EditExternalAddressJobState,
  type EditExternalAddressResult,
  type EditExternalAddressScopeIntentInput,
  type EditExternalAddressScopeJobState,
} from "../intents";
import { resolveContactDeviceContext } from "../resolveContactDeviceContext";
import type { ContactOperation, ContactOperationOutcome } from "../types";

type IdentifierOperation = ContactOperation<
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierIntentInput,
  PortResult
>;

type ScopeOperation = ContactOperation<
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeIntentInput,
  PortResult
>;

type CombinedOperation = ContactOperation<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  PortResult
>;

export type EditExternalAddressOperation =
  | { readonly type: "immediate"; readonly result: PortResult }
  | { readonly type: "identifier"; readonly operation: IdentifierOperation }
  | { readonly type: "scope"; readonly operation: ScopeOperation }
  | { readonly type: "combined"; readonly operation: CombinedOperation };

function toPortResult(result: EditExternalAddressResult): PortResult {
  return ExternalAddressDeviceContextSchema.parse({
    blockchainFamily: result.blockchainFamily,
    chainId: result.chainId,
    hmacRest: result.hmacRest,
  });
}

function classifyIdentifier(
  state: EditExternalAddressIdentifierJobState,
): ContactOperationOutcome<PortResult> {
  switch (state.type) {
    case "completed":
      return { type: "success", result: toPortResult(state.result) };
    case "failed":
      return {
        type: "failure",
        error: new EditExternalAddressError(undefined, { cause: state.error }),
      };
    case "pending":
    case "awaiting-device-confirmation":
      return { type: "pending" };
  }
}

function classifyScope(
  state: EditExternalAddressScopeJobState,
): ContactOperationOutcome<PortResult> {
  switch (state.type) {
    case "completed":
      return { type: "success", result: toPortResult(state.result) };
    case "failed":
      return {
        type: "failure",
        error: new EditExternalAddressError(undefined, { cause: state.error }),
      };
    case "pending":
    case "awaiting-device-confirmation":
      return { type: "pending" };
  }
}

function classifyCombined(state: EditExternalAddressJobState): ContactOperationOutcome<PortResult> {
  switch (state.type) {
    case "completed":
      return { type: "success", result: toPortResult(state.result) };
    case "failed":
      return {
        type: "failure",
        error: new EditExternalAddressError(
          state.partialResult === undefined ? undefined : toPortResult(state.partialResult),
          { cause: state.error },
        ),
      };
    case "pending":
    case "awaiting-device-confirmation":
    case "partial-result":
      return { type: "pending" };
  }
}

export function createEditExternalAddressOperation(
  input: EditExternalAddressInput,
): EditExternalAddressOperation {
  const labelChanged = input.label !== input.address.label;
  const addressChanged = input.updatedAddress !== input.address.address;

  if (!labelChanged && !addressChanged) {
    return { type: "immediate", result: input.address.device };
  }

  const credentials = input.contact.deviceCredentials;
  if (credentials === undefined) {
    throw new Error("Contact device credentials are required to edit an address");
  }

  const context = resolveContactDeviceContext(input.address.currencyId);
  const commonInput = {
    contactName: input.contact.name,
    blockchainFamily: context.blockchainFamily,
    chainId: context.chainId,
    groupHandle: credentials.groupHandle,
    hmacProof: credentials.hmacProof,
    hmacRest: input.address.device.hmacRest,
  };

  if (labelChanged && addressChanged) {
    return {
      type: "combined",
      operation: {
        definition: editExternalAddressIntentPlatformDefinition,
        input: {
          ...commonInput,
          previousScope: input.address.label,
          newScope: input.label,
          previousAddress: input.address.address,
          newAddress: input.updatedAddress,
        },
        initializationInput: context.initializationInput,
        classify: classifyCombined,
      },
    };
  }

  if (addressChanged) {
    return {
      type: "identifier",
      operation: {
        definition: editExternalAddressIdentifierIntentPlatformDefinition,
        input: {
          ...commonInput,
          scope: input.address.label,
          previousAddress: input.address.address,
          newAddress: input.updatedAddress,
        },
        initializationInput: context.initializationInput,
        classify: classifyIdentifier,
      },
    };
  }

  return {
    type: "scope",
    operation: {
      definition: editExternalAddressScopeIntentPlatformDefinition,
      input: {
        ...commonInput,
        previousScope: input.address.label,
        newScope: input.label,
        address: input.address.address,
      },
      initializationInput: context.initializationInput,
      classify: classifyScope,
    },
  };
}
