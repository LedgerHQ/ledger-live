import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import {
  DeviceActionStatus,
  DeviceModelId,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import {
  ContactDeviceIntentCancelledError,
  ContactDeviceIntentScopeEditUnsupportedError,
} from "../../errors";
import { editExternalAddressIntentJob } from "./job";
import type { EditExternalAddressIntentInput, EditExternalAddressJobState } from "./types";

jest.mock("@ledgerhq/device-contacts-kit", () => ({
  ContactsManagerBuilder: jest.fn(),
}));

const mockedContactsManagerBuilder = ContactsManagerBuilder as unknown as jest.Mock;

/** Hex string (no 0x) to bytes, so kit-call expectations stay readable. */
const bytes = (hex: string) =>
  Uint8Array.from((hex.match(/../g) ?? []).map(pair => parseInt(pair, 16)));

const INPUT: EditExternalAddressIntentInput = {
  contactName: "Alice",
  previousScope: "Mainnet",
  newScope: "Mainnet",
  previousAddress: "0xAbC0000000000000000000000000000000000001",
  newAddress: "0xAbC0000000000000000000000000000000000002",
  blockchainFamily: "evm",
  chainId: 1,
  groupHandle: "0x0102",
  hmacProof: "0x0304",
  hmacRest: "0x0506",
};

function startJob(input: EditExternalAddressIntentInput = INPUT) {
  const subject = new Subject<unknown>();
  const cancel = jest.fn();
  const editExternalAddressIdentifier = jest.fn(() => ({
    observable: subject.asObservable(),
    cancel,
  }));
  const build = jest.fn(() => ({ editExternalAddressIdentifier }));
  mockedContactsManagerBuilder.mockImplementation(() => ({ build }));

  const states: EditExternalAddressJobState[] = [];
  const onResult = jest.fn();
  let error: unknown;
  let completed = false;

  const subscription = editExternalAddressIntentJob({
    deviceConnectionResult: {
      dmk: { id: "mock-dmk" } as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.STAX } as never,
      compatDeviceId: "compat-1",
      compatDeviceName: "Ledger Stax",
      compatDeviceWired: true,
    },
    deviceExtractedContext: {
      currentOsVersion: "1.0.0",
      osUpdateAvailable: false,
      currentAppName: "Ethereum",
      currentAppVersion: "1.16.0",
    },
    input,
    onResult,
  }).subscribe({
    next: state => states.push(state),
    error: e => {
      error = e;
    },
    complete: () => {
      completed = true;
    },
  });

  return {
    states,
    onResult,
    cancel,
    editExternalAddressIdentifier,
    subscription,
    emit: (state: unknown) => subject.next(state),
    fail: (err: unknown) => subject.error(err),
    isCompleted: () => completed,
    getError: () => error,
  };
}

const COMPLETION = {
  status: DeviceActionStatus.Completed,
  output: {
    contactName: "Alice",
    scope: "Mainnet",
    previousIdentifier: new Uint8Array([0xab, 0xc0, 0x01]),
    identifier: new Uint8Array([0xab, 0xc0, 0x02]),
    blockchainFamily: "ethereum",
    chainId: 1n,
    groupHandle: new Uint8Array([0x01, 0x02]),
    hmacProof: new Uint8Array([0x03, 0x04]),
    hmacRest: new Uint8Array([0x07, 0x08]),
  },
};

const REJECTION = {
  status: DeviceActionStatus.Error,
  error: {
    _tag: "ContactsCommandError",
    errorCode: "6a80",
    message: "SWO_INCORRECT_DATA",
  },
};

function lastRejection(job: ReturnType<typeof startJob>) {
  const state = [...job.states].reverse().find(s => s.type === "device-rejected");
  if (state === undefined) throw new Error("Expected the job to have reported a rejection");
  return state;
}

describe("editExternalAddressIntentJob", () => {
  it("GIVEN an address-only edit WHEN the device completes THEN it reports the rotated address proof", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit(COMPLETION);

    // THEN
    expect(job.states).toContainEqual({ type: "completed" });
    expect(job.onResult).toHaveBeenCalledWith({
      type: "success",
      result: {
        contactName: "Alice",
        scope: "Mainnet",
        address: INPUT.newAddress,
        // The caller's own family/chainId conventions, not the kit's wire ones.
        blockchainFamily: "evm",
        chainId: 1,
        groupHandle: INPUT.groupHandle,
        // An identifier edit leaves the group-level name proof untouched...
        hmacProof: INPUT.hmacProof,
        // ...and rotates only the address-level one.
        hmacRest: "0x0708",
      },
    });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN an address-only edit WHEN starting THEN it decodes both identifiers and the proofs for the kit call", () => {
    // WHEN
    const job = startJob();

    // THEN
    expect(job.editExternalAddressIdentifier).toHaveBeenCalledWith({
      contactName: "Alice",
      scope: "Mainnet",
      previousIdentifier: bytes(`abc0${"00".repeat(17)}01`),
      newIdentifier: bytes(`abc0${"00".repeat(17)}02`),
      blockchainFamily: "ethereum",
      chainId: 1n,
      groupHandle: new Uint8Array([0x01, 0x02]),
      hmacProof: new Uint8Array([0x03, 0x04]),
      hmacRest: new Uint8Array([0x05, 0x06]),
      skipOpenApp: true,
    });
  });

  it("GIVEN a scope-only edit WHEN starting THEN it refuses up front without touching the device", () => {
    // GIVEN
    // EDIT SCOPE is not in the kit yet (DSDK-1380), and the scope is bound into
    // hmacRest, so it must not be applied host-side.
    const input: EditExternalAddressIntentInput = { ...INPUT, newScope: "Testnet" };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.editExternalAddressIdentifier).not.toHaveBeenCalled();
    expect(job.states).toEqual([
      {
        type: "scope-edit-unsupported",
        error: expect.any(ContactDeviceIntentScopeEditUnsupportedError),
      },
    ]);
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.any(ContactDeviceIntentScopeEditUnsupportedError),
    });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN an edit changing both scope and address WHEN starting THEN it refuses without applying the identifier half", () => {
    // GIVEN
    const input: EditExternalAddressIntentInput = {
      ...INPUT,
      newScope: "Testnet",
      newAddress: "0xAbC0000000000000000000000000000000000009",
    };

    // WHEN
    const job = startJob(input);

    // THEN
    // Refusing before any device interaction is what keeps the stored proof and
    // the device in sync: a half-applied edit would desync them.
    expect(job.editExternalAddressIdentifier).not.toHaveBeenCalled();
    expect(job.states).toContainEqual({
      type: "scope-edit-unsupported",
      error: expect.any(ContactDeviceIntentScopeEditUnsupportedError),
    });
    expect(job.states).not.toContainEqual({ type: "partial-result" });
  });

  it("GIVEN the device requires wallet confirmation WHEN pending THEN it reports awaiting-device-confirmation for the identifier step", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit({
      status: DeviceActionStatus.Pending,
      intermediateValue: { requiredUserInteraction: UserInteractionRequired.RegisterWallet },
    });

    // THEN
    expect(job.states).toContainEqual({
      type: "awaiting-device-confirmation",
      step: "identifier",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Ledger Stax",
    });
  });

  it("GIVEN the device action has not started yet WHEN reported THEN it reports pending", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit({ status: DeviceActionStatus.NotStarted });

    // THEN
    expect(job.states).toContainEqual({ type: "pending" });
  });

  it("GIVEN an unrelated pending interaction WHEN pending THEN it reports pending", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit({
      status: DeviceActionStatus.Pending,
      intermediateValue: { requiredUserInteraction: UserInteractionRequired.UnlockDevice },
    });

    // THEN
    expect(job.states).toContainEqual({ type: "pending" });
  });

  it("GIVEN a version-too-low device error WHEN the device action errors THEN it reports app-version-too-low", () => {
    // GIVEN
    const job = startJob();
    const error = { _tag: "ContactsVersionRequirementError" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "app-version-too-low",
      error: expect.objectContaining({ message: "ContactsVersionRequirementError" }),
    });
  });

  it("GIVEN a validation device error WHEN the device action errors THEN it reports invalid-input", () => {
    // GIVEN
    const job = startJob();
    const error = { _tag: "ContactsValidationError", message: "scope too long" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "invalid-input",
      error: expect.objectContaining({ message: "scope too long" }),
    });
  });

  it("GIVEN status word 0x6a80 WHEN the device action errors THEN it reports device-rejected", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit(REJECTION);

    // THEN
    expect(job.states).toContainEqual({
      type: "device-rejected",
      error: expect.objectContaining({ message: "SWO_INCORRECT_DATA" }),
      retry: expect.any(Function),
    });
  });

  it("GIVEN a rejection WHEN it is reported THEN the job stays open so the user can retry", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit(REJECTION);

    // THEN
    expect(job.isCompleted()).toBe(false);
    expect(job.onResult).not.toHaveBeenCalled();
  });

  it("GIVEN a rejection WHEN the user retries THEN it replays the device action", () => {
    // GIVEN
    const job = startJob();
    job.emit(REJECTION);

    // WHEN
    lastRejection(job).retry?.();

    // THEN
    expect(job.editExternalAddressIdentifier).toHaveBeenCalledTimes(2);
    expect(job.cancel).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a retried rejection WHEN the device confirms THEN it reports success and completes", () => {
    // GIVEN
    const job = startJob();
    job.emit(REJECTION);
    lastRejection(job).retry?.();

    // WHEN
    job.emit(COMPLETION);

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "success",
      result: expect.objectContaining({ address: INPUT.newAddress, hmacRest: "0x0708" }),
    });
    expect(job.states).toContainEqual({ type: "completed" });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN a rejection WHEN the user gives up instead THEN it settles as a cancellation", () => {
    // GIVEN
    const job = startJob();
    job.emit(REJECTION);

    // WHEN
    job.subscription.unsubscribe();

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.any(ContactDeviceIntentCancelledError),
    });
  });

  it("GIVEN status word 0x6982 WHEN the device action errors THEN it reports existing-group-verification-failed", () => {
    // GIVEN
    const job = startJob();
    // An edit always replays the entry's existing proofs, so this is how proofs
    // bound to another device surface.
    const error = {
      _tag: "ContactsCommandError",
      errorCode: "6982",
      message: "SWO_SECURITY_CONDITION_NOT_SATISFIED",
    };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "existing-group-verification-failed",
      error: expect.objectContaining({ message: "SWO_SECURITY_CONDITION_NOT_SATISFIED" }),
    });
  });

  it("GIVEN status word 0x6984 WHEN the device action errors THEN it reports unsupported-operation", () => {
    // GIVEN
    const job = startJob();
    const error = {
      _tag: "ContactsCommandError",
      errorCode: "6984",
      message: "SWO_CONDITIONS_NOT_SATISFIED",
    };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "unsupported-operation",
      error: expect.objectContaining({ message: "SWO_CONDITIONS_NOT_SATISFIED" }),
    });
  });

  it("GIVEN an unrecognized status word WHEN the device action errors THEN it reports failed", () => {
    // GIVEN
    const job = startJob();
    const error = {
      _tag: "ContactsCommandError",
      errorCode: "6b00",
      message: "SWO_WRONG_PARAMETER_VALUE",
    };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "failed",
      error: expect.objectContaining({ message: "SWO_WRONG_PARAMETER_VALUE" }),
    });
  });

  it("GIVEN an untagged device error WHEN the device action errors THEN it reports failed", () => {
    // GIVEN
    const job = startJob();
    const error = { _tag: "UnknownDAError" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "failed",
      error: expect.objectContaining({ message: "UnknownDAError" }),
    });
  });

  it.each([
    ["previous address", { previousAddress: "not-hex" }],
    ["new address", { newAddress: "not-hex" }],
    ["group handle", { groupHandle: "not-hex" }],
    ["hmac proof", { hmacProof: "not-hex" }],
    ["hmac rest", { hmacRest: "not-hex" }],
    ["chainId", { chainId: "not-a-number" }],
  ] as const)(
    "GIVEN an invalid %s WHEN starting THEN it fails immediately without calling the kit",
    (_, override) => {
      // GIVEN
      const input: EditExternalAddressIntentInput = { ...INPUT, ...override };

      // WHEN
      const job = startJob(input);

      // THEN
      expect(job.editExternalAddressIdentifier).not.toHaveBeenCalled();
      expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
      expect(job.states).toContainEqual({ type: "invalid-input", error: expect.any(Error) });
      expect(job.isCompleted()).toBe(true);
    },
  );

  it("GIVEN an active edit WHEN the caller unsubscribes before completion THEN it cancels the device action and reports cancellation", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.subscription.unsubscribe();

    // THEN
    expect(job.cancel).toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.any(ContactDeviceIntentCancelledError),
    });
  });

  it("GIVEN the device action is stopped WHEN reported THEN it reports failure", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit({ status: DeviceActionStatus.Stopped });

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
    expect(job.states).toContainEqual({ type: "failed", error: expect.any(Error) });
  });

  it("GIVEN the device action observable errors WHEN reported THEN it reports failure with a terminal failed state", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.fail(new Error("transport disconnected"));

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.objectContaining({ message: "transport disconnected" }),
    });
    expect(job.states).toContainEqual({
      type: "failed",
      error: expect.objectContaining({ message: "transport disconnected" }),
    });
    expect(job.isCompleted()).toBe(true);
    expect(job.getError()).toBeUndefined();
  });
});
