import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import {
  DeviceActionStatus,
  DeviceModelId,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { ContactDeviceIntentCancelledError } from "../../errors";
import { renameContactIntentJob } from "./job";
import type { RenameContactIntentInput, RenameContactJobState } from "./types";

jest.mock("@ledgerhq/device-contacts-kit", () => ({
  ContactsManagerBuilder: jest.fn(),
}));

const mockedContactsManagerBuilder = ContactsManagerBuilder as unknown as jest.Mock;

const INPUT: RenameContactIntentInput = {
  previousContactName: "Alice",
  newContactName: "Alice Cooper",
  groupHandle: "0x0102",
  hmacProof: "0x0304",
};

function startJob(input: RenameContactIntentInput = INPUT) {
  const subject = new Subject<unknown>();
  const cancel = jest.fn();
  const renameContact = jest.fn(() => ({ observable: subject.asObservable(), cancel }));
  const registerExternalAddress = jest.fn();
  const build = jest.fn(() => ({ renameContact, registerExternalAddress }));
  mockedContactsManagerBuilder.mockImplementation(() => ({ build }));

  const states: RenameContactJobState[] = [];
  const onResult = jest.fn();
  let error: unknown;
  let completed = false;

  const subscription = renameContactIntentJob({
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
      // Rename runs from the dashboard, so BOLOS is what Phase 2 leaves running.
      currentAppName: "BOLOS",
      currentAppVersion: "1.0.0",
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
    renameContact,
    registerExternalAddress,
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
    previousContactName: "Alice",
    contactName: "Alice Cooper",
    groupHandle: new Uint8Array([0x01, 0x02]),
    hmacProof: new Uint8Array([0x05, 0x06]),
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

describe("renameContactIntentJob", () => {
  it("GIVEN a rename WHEN the device completes THEN it reports the rotated proof hex-encoded", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit(COMPLETION);

    // THEN
    expect(job.states).toContainEqual({ type: "completed" });
    expect(job.onResult).toHaveBeenCalledWith({
      type: "success",
      result: {
        previousContactName: "Alice",
        contactName: "Alice Cooper",
        groupHandle: "0x0102",
        // Replaces the input proof: the device rotates `hmac_name` on rename.
        hmacProof: "0x0506",
      },
    });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN a rename WHEN starting THEN it decodes the hex handle and proof for the kit call", () => {
    // WHEN
    const job = startJob();

    // THEN
    expect(job.renameContact).toHaveBeenCalledWith({
      previousContactName: "Alice",
      newContactName: "Alice Cooper",
      groupHandle: new Uint8Array([0x01, 0x02]),
      hmacProof: new Uint8Array([0x03, 0x04]),
    });
  });

  it("GIVEN a rename WHEN starting THEN it never asks the kit to open or skip a coin app", () => {
    // WHEN
    const job = startJob();

    // THEN
    // Rename is a dashboard operation: the device action goes to the dashboard
    // itself, so the job passes no app-opening switch of any kind.
    const [deviceActionInput] = job.renameContact.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(deviceActionInput).not.toHaveProperty("skipOpenApp");
    expect(deviceActionInput).not.toHaveProperty("blockchainFamily");
    expect(deviceActionInput).not.toHaveProperty("chainId");
    expect(job.registerExternalAddress).not.toHaveBeenCalled();
  });

  it("GIVEN the device requires wallet confirmation WHEN pending THEN it reports awaiting-device-confirmation", () => {
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

  it("GIVEN a go-to-dashboard interaction WHEN pending THEN it reports pending", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    // The device action walks to the dashboard before asking for approval; the
    // executor owns those screens, so the job just holds the spinner.
    job.emit({
      status: DeviceActionStatus.Pending,
      intermediateValue: { requiredUserInteraction: UserInteractionRequired.UnlockDevice },
    });

    // THEN
    expect(job.states).toContainEqual({ type: "pending" });
  });

  it("GIVEN an unsupported OS WHEN the device action errors THEN it reports the version failure", () => {
    // GIVEN
    const job = startJob();
    // Rename is OS-gated: the device action raises this after going to the
    // dashboard, since nothing gates the OS floor before it runs.
    const error = { _tag: "ContactsVersionRequirementError" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.objectContaining({ message: "ContactsVersionRequirementError" }),
    });
    expect(job.states).toContainEqual({
      type: "app-version-too-low",
      error: expect.objectContaining({ message: "ContactsVersionRequirementError" }),
    });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN a validation device error WHEN the device action errors THEN it reports invalid-input", () => {
    // GIVEN
    const job = startJob();
    const error = { _tag: "ContactsValidationError", message: "contact name too long" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.states).toContainEqual({
      type: "invalid-input",
      error: expect.objectContaining({ message: "contact name too long" }),
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
    expect(job.renameContact).toHaveBeenCalledTimes(2);
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
      result: expect.objectContaining({ contactName: "Alice Cooper", hmacProof: "0x0506" }),
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
    // Rename always replays the group's existing name proof, so this is how a
    // proof bound to another device surfaces.
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

  it("GIVEN an invalid group handle WHEN starting THEN it fails immediately without calling the kit", () => {
    // GIVEN
    const input: RenameContactIntentInput = { ...INPUT, groupHandle: "not-hex" };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.renameContact).not.toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
    expect(job.states).toContainEqual({ type: "invalid-input", error: expect.any(Error) });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN an invalid hmac proof WHEN starting THEN it fails immediately without calling the kit", () => {
    // GIVEN
    const input: RenameContactIntentInput = { ...INPUT, hmacProof: "not-hex" };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.renameContact).not.toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
    expect(job.states).toContainEqual({ type: "invalid-input", error: expect.any(Error) });
  });

  it("GIVEN an active rename WHEN the caller unsubscribes before completion THEN it cancels the device action and reports cancellation", () => {
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
