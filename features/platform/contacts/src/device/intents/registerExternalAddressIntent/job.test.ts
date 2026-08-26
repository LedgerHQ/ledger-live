import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { ContactDeviceIntentCancelledError } from "../../errors";
import { registerExternalAddressIntentJob } from "./job";
import type { RegisterExternalAddressIntentInput, RegisterExternalAddressJobState } from "./types";

jest.mock("@ledgerhq/device-contacts-kit", () => ({
  ContactsManagerBuilder: jest.fn(),
}));

const mockedContactsManagerBuilder = ContactsManagerBuilder as unknown as jest.Mock;

const INPUT: RegisterExternalAddressIntentInput = {
  contactName: "Alice",
  scope: "Mainnet",
  address: "0xAbC0000000000000000000000000000000000001",
  blockchainFamily: "evm",
  chainId: 1,
};

function startJob(input: RegisterExternalAddressIntentInput = INPUT) {
  const subject = new Subject<unknown>();
  const cancel = jest.fn();
  const registerExternalAddress = jest.fn(() => ({ observable: subject.asObservable(), cancel }));
  const build = jest.fn(() => ({ registerExternalAddress }));
  mockedContactsManagerBuilder.mockImplementation(() => ({ build }));

  const states: RegisterExternalAddressJobState[] = [];
  const onResult = jest.fn();
  let error: unknown;
  let completed = false;

  const subscription = registerExternalAddressIntentJob({
    deviceConnectionResult: {
      dmk: { id: "mock-dmk" } as never,
      sessionId: "session-1",
      connectedDevice: {} as never,
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
    registerExternalAddress,
    subscription,
    emit: (state: unknown) => subject.next(state),
    fail: (err: unknown) => subject.error(err),
    isCompleted: () => completed,
    getError: () => error,
  };
}

describe("registerExternalAddressIntentJob", () => {
  it("GIVEN a new contact group WHEN the device completes THEN it reports success with hex-encoded proofs", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.emit({
      status: DeviceActionStatus.Completed,
      output: {
        mode: "newContactGroup",
        contactName: "Alice",
        scope: "Mainnet",
        identifier: new Uint8Array([0xab, 0xc0]),
        blockchainFamily: "ethereum",
        chainId: 1n,
        groupHandle: new Uint8Array([0x01, 0x02]),
        hmacProof: new Uint8Array([0x03, 0x04]),
        hmacRest: new Uint8Array([0x05, 0x06]),
      },
    });

    // THEN
    expect(job.states).toContainEqual({ type: "completed" });
    expect(job.onResult).toHaveBeenCalledWith({
      type: "success",
      result: {
        mode: "newContactGroup",
        contactName: "Alice",
        scope: "Mainnet",
        address: INPUT.address,
        blockchainFamily: "evm",
        chainId: 1,
        groupHandle: "0x0102",
        hmacProof: "0x0304",
        hmacRest: "0x0506",
      },
    });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN an existing contact group WHEN registering THEN it decodes the hex handle/proof for the kit call", () => {
    // GIVEN
    const input: RegisterExternalAddressIntentInput = {
      ...INPUT,
      existingContactGroup: { groupHandle: "0x0102", hmacProof: "0x0304" },
    };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.registerExternalAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        existingContactGroup: {
          groupHandle: new Uint8Array([0x01, 0x02]),
          hmacProof: new Uint8Array([0x03, 0x04]),
        },
        skipOpenApp: true,
        blockchainFamily: "ethereum",
        chainId: 1n,
      }),
    );
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
    expect(job.states).toContainEqual({ type: "awaiting-device-confirmation" });
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

  it("GIVEN a typed device error WHEN the device action errors THEN it reports failure", () => {
    // GIVEN
    const job = startJob();
    const error = { _tag: "ContactsVersionRequirementError" };

    // WHEN
    job.emit({ status: DeviceActionStatus.Error, error });

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.objectContaining({ message: "ContactsVersionRequirementError" }),
    });
    expect(job.states).toContainEqual({
      type: "failed",
      error: expect.objectContaining({ message: "ContactsVersionRequirementError" }),
    });
  });

  it("GIVEN an invalid address WHEN starting THEN it fails immediately without calling the kit", () => {
    // GIVEN
    const input: RegisterExternalAddressIntentInput = { ...INPUT, address: "not-hex" };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.registerExternalAddress).not.toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
    expect(job.states).toContainEqual({ type: "failed", error: expect.any(Error) });
    expect(job.isCompleted()).toBe(true);
  });

  it("GIVEN an active registration WHEN the caller unsubscribes before completion THEN it cancels the device action and reports cancellation", () => {
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

  it("GIVEN a non-numeric chainId WHEN starting THEN it fails immediately without calling the kit", () => {
    // GIVEN
    const input: RegisterExternalAddressIntentInput = { ...INPUT, chainId: "not-a-number" };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.registerExternalAddress).not.toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
  });

  it("GIVEN an invalid existing contact group WHEN starting THEN it fails immediately without calling the kit", () => {
    // GIVEN
    const input: RegisterExternalAddressIntentInput = {
      ...INPUT,
      existingContactGroup: { groupHandle: "not-hex", hmacProof: "0x0304" },
    };

    // WHEN
    const job = startJob(input);

    // THEN
    expect(job.registerExternalAddress).not.toHaveBeenCalled();
    expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
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

  it("GIVEN the device action observable errors WHEN reported THEN it reports failure and errors the job observable", () => {
    // GIVEN
    const job = startJob();

    // WHEN
    job.fail(new Error("transport disconnected"));

    // THEN
    expect(job.onResult).toHaveBeenCalledWith({
      type: "failure",
      error: expect.objectContaining({ message: "transport disconnected" }),
    });
    expect(job.getError()).toEqual(expect.objectContaining({ message: "transport disconnected" }));
  });
});
