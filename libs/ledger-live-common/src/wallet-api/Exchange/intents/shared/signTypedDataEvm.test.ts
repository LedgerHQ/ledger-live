import { lastValueFrom, Subject, toArray } from "rxjs";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import type { EIP712Message } from "@ledgerhq/types-live";

// `@ledgerhq/device-signer-kit-ethereum` lazily loads
// `@ledgerhq/context-module` through its `SendGetAddressTask` submodule;
// that transitive isn't installed in this package's pnpm graph, so we
// stub the surface used by both the production helper and these tests.
// The factory is inlined (no closed-over const) because jest hoists
// `jest.mock` calls above top-level declarations.
jest.mock("@ledgerhq/device-signer-kit-ethereum", () => ({
  SignTypedDataDAStateStep: {
    GET_APP_CONFIG: "signer.eth.steps.getAppConfig",
    GET_ADDRESS: "signer.eth.steps.getAddress",
    BUILD_CONTEXT: "signer.eth.steps.buildContext",
    PROVIDE_CONTEXT: "signer.eth.steps.provideContext",
    PROVIDE_GENERIC_CONTEXT: "signer.eth.steps.provideGenericContext",
    SIGN_TYPED_DATA: "signer.eth.steps.signTypedData",
    SIGN_TYPED_DATA_LEGACY: "signer.eth.steps.signTypedDataLegacy",
  },
}));

const SignTypedDataDAStateStep = {
  GET_APP_CONFIG: "signer.eth.steps.getAppConfig",
  GET_ADDRESS: "signer.eth.steps.getAddress",
  BUILD_CONTEXT: "signer.eth.steps.buildContext",
  PROVIDE_CONTEXT: "signer.eth.steps.provideContext",
  PROVIDE_GENERIC_CONTEXT: "signer.eth.steps.provideGenericContext",
  SIGN_TYPED_DATA: "signer.eth.steps.signTypedData",
  SIGN_TYPED_DATA_LEGACY: "signer.eth.steps.signTypedDataLegacy",
} as const;

let signerStates: Subject<unknown>;
const cancel = jest.fn();
const signTypedData = jest.fn(() => ({
  observable: signerStates.asObservable(),
  cancel,
}));

jest.mock("@ledgerhq/live-signer-evm", () => ({
  DmkSignerEth: jest.fn().mockImplementation(() => ({
    signer: { signTypedData },
  })),
}));

import { runSignTypedDataEvm } from "./signTypedDataEvm";
import type { SignTypedDataEvmRunState } from "./signTypedDataEvm";

const FAKE_CONNECTION = {} as DeviceConnectionResult;
const FAKE_TYPED_DATA = { primaryType: "x" } as unknown as EIP712Message;
const FAKE_PATH = "44'/60'/0'/0/0";
const FAKE_LABEL = "Sign typed data failed";

beforeEach(() => {
  signerStates = new Subject<unknown>();
  cancel.mockClear();
  signTypedData.mockClear();
});

describe("runSignTypedDataEvm — DMK state mapping", () => {
  it.each([
    SignTypedDataDAStateStep.GET_APP_CONFIG,
    SignTypedDataDAStateStep.GET_ADDRESS,
    SignTypedDataDAStateStep.BUILD_CONTEXT,
    SignTypedDataDAStateStep.PROVIDE_CONTEXT,
    SignTypedDataDAStateStep.PROVIDE_GENERIC_CONTEXT,
  ])("maps Pending + context step %s to `loading-context`", async step => {
    const collected = lastValueFrom(
      runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, FAKE_LABEL).pipe(toArray()),
    );
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: { step, requiredUserInteraction: "none" },
    });
    signerStates.complete();
    const states = await collected;
    expect(states[0]).toEqual({ type: "loading-context" });
  });

  it("maps Pending + requiredUserInteraction: SignTypedData to `awaiting-confirmation`", async () => {
    const collected = lastValueFrom(
      runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, FAKE_LABEL).pipe(toArray()),
    );
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        step: SignTypedDataDAStateStep.SIGN_TYPED_DATA,
        requiredUserInteraction: UserInteractionRequired.SignTypedData,
      },
    });
    signerStates.complete();
    const states = await collected;
    expect(states[0]).toEqual({ type: "awaiting-confirmation" });
  });

  it.each([
    SignTypedDataDAStateStep.SIGN_TYPED_DATA,
    SignTypedDataDAStateStep.SIGN_TYPED_DATA_LEGACY,
  ])("maps Pending + sign step %s to `signing`", async step => {
    const collected = lastValueFrom(
      runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, FAKE_LABEL).pipe(toArray()),
    );
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: { step, requiredUserInteraction: "none" },
    });
    signerStates.complete();
    const states = await collected;
    expect(states[0]).toEqual({ type: "signing" });
  });

  it("maps Completed to `signed` with canonical 65-byte EIP-2098 hex", async () => {
    const collected = lastValueFrom(
      runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, FAKE_LABEL).pipe(toArray()),
    );
    signerStates.next({
      status: DeviceActionStatus.Completed,
      output: {
        r: "0x" + "11".repeat(32),
        s: "0x" + "22".repeat(32),
        v: 27,
      },
    });
    signerStates.complete();
    const states = await collected;
    expect(states).toHaveLength(1);
    const terminal = states[0] as Extract<SignTypedDataEvmRunState, { type: "signed" }>;
    expect(terminal.type).toBe("signed");
    expect(terminal.signatureHex).toMatch(/^0x[0-9a-fA-F]{130}$/);
    expect(terminal.signatureHex.toLowerCase()).toBe(
      "0x" + "11".repeat(32) + "22".repeat(32) + "1b",
    );
  });

  it("maps Error to `failed`, surfacing the errorLabel through mapDmkSignerError", async () => {
    const collected = lastValueFrom(
      runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, "Sign permit failed").pipe(
        toArray(),
      ),
    );
    signerStates.next({
      status: DeviceActionStatus.Error,
      error: { errorCode: "6800", message: "boom" },
    });
    signerStates.complete();
    const states = await collected;
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      // No `_tag` in the error → mapDmkSignerError falls back to the errorLabel.
      expect(terminal.error.message).toBe("Sign permit failed (code: 6800) - boom");
    }
  });

  it("creates a fresh signer session on every subscribe and runs `cancel` via finalize", async () => {
    const obs = runSignTypedDataEvm(FAKE_CONNECTION, FAKE_TYPED_DATA, FAKE_PATH, FAKE_LABEL);

    // First subscription completes via the device flow.
    const first = lastValueFrom(obs.pipe(toArray()));
    signerStates.next({
      status: DeviceActionStatus.Completed,
      output: {
        r: "0x" + "33".repeat(32),
        s: "0x" + "44".repeat(32),
        v: 28,
      },
    });
    signerStates.complete();
    await first;
    expect(cancel).toHaveBeenCalledTimes(1);

    // Second subscription must create a brand-new signer (defer contract).
    signerStates = new Subject<unknown>();
    const sub = obs.subscribe();
    sub.unsubscribe();
    expect(signTypedData).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});
