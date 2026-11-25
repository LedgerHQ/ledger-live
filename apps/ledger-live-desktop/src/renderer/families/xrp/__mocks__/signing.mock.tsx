import React from "react";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { XRP_ACCOUNT } from "./account.mock";

// Stands in for useAccountBridge, useBroadcast, createIntent and DeviceIntentExecutor:
// jest.mock(path, () => require("../__mocks__/signing.mock"))

export const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
export const mockSignedInput = jest.fn();

export const signedOperation = {
  signature: "signature",
  operation: {
    id: "op-signed",
    accountId: XRP_ACCOUNT.id,
    hash: "",
    type: "OPT_IN",
  },
} as unknown as SignedOperation;

export function makeNamedError(name: string, fields: object = {}) {
  return Object.assign(new Error(name), { name }, fields);
}

export function useAccountBridge() {
  return {
    createTransaction: () => ({ family: "xrp" }),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  };
}

export function useBroadcast() {
  return mockBroadcast;
}

export function createIntent(_: unknown, input: unknown, callbacks: unknown) {
  mockSignedInput(input);

  return { input, callbacks };
}

export async function buildDeviceInitializationInput() {
  return {};
}

type DeviceIntentExecutorProps = Readonly<{
  intent: { callbacks: { onResult: (result: SignedOperation) => void } };
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
}>;

export function DeviceIntentExecutor(props: DeviceIntentExecutorProps) {
  return (
    <>
      <button
        onClick={() => {
          props.intent.callbacks.onResult(signedOperation);
          props.onIntentJobComplete();
        }}
      >
        Sign on device
      </button>
      <button onClick={props.onUserCancel}>Cancel on device</button>
    </>
  );
}
