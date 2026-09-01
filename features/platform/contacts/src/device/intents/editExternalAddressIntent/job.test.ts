import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import {
  DeviceActionStatus,
  DeviceModelId,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { ContactDeviceIntentCancelledError } from "../../errors";
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

/** Changes the scope only, leaving the address untouched. */
const SCOPE_ONLY: EditExternalAddressIntentInput = {
  ...INPUT,
  newScope: "Testnet",
  newAddress: INPUT.previousAddress,
};

/** Changes both fields, so the job runs the identifier step then the scope step. */
const COMBINED: EditExternalAddressIntentInput = { ...INPUT, newScope: "Testnet" };

/**
 * Drives the job against a fake ContactsManager. Each kit method gets its own
 * subject per call, so a chained or replayed edit can be stepped independently:
 * `identifierRun(0)` is the first identifier attempt, `(1)` the retry, and so on.
 */
function startJob(input: EditExternalAddressIntentInput = INPUT) {
  const runs = { identifier: [] as Subject<unknown>[], scope: [] as Subject<unknown>[] };
  const cancels = { identifier: [] as jest.Mock[], scope: [] as jest.Mock[] };

  const makeMethod = (key: "identifier" | "scope") =>
    jest.fn(() => {
      const subject = new Subject<unknown>();
      const cancel = jest.fn();
      runs[key].push(subject);
      cancels[key].push(cancel);
      return { observable: subject.asObservable(), cancel };
    });

  const editExternalAddressIdentifier = makeMethod("identifier");
  const editExternalAddressScope = makeMethod("scope");
  const build = jest.fn(() => ({ editExternalAddressIdentifier, editExternalAddressScope }));
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

  const emitTo = (key: "identifier" | "scope", run: number) => (state: unknown) => {
    const subject = runs[key][run];
    if (subject === undefined) throw new Error(`No ${key} run at index ${run}`);
    subject.next(state);
  };

  return {
    states,
    onResult,
    subscription,
    editExternalAddressIdentifier,
    editExternalAddressScope,
    /** Emits into the nth identifier attempt (default: the first). */
    emitIdentifier: (state: unknown, run = 0) => emitTo("identifier", run)(state),
    /** Emits into the nth scope attempt (default: the first). */
    emitScope: (state: unknown, run = 0) => emitTo("scope", run)(state),
    failIdentifier: (err: unknown, run = 0) => runs.identifier[run]?.error(err),
    failScope: (err: unknown, run = 0) => runs.scope[run]?.error(err),
    identifierCancel: (run = 0) => cancels.identifier[run],
    scopeCancel: (run = 0) => cancels.scope[run],
    isCompleted: () => completed,
    getError: () => error,
  };
}

const identifierCompletion = (hmacRest: number[]) => ({
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
    hmacRest: new Uint8Array(hmacRest),
  },
});

const scopeCompletion = (hmacRest: number[]) => ({
  status: DeviceActionStatus.Completed,
  output: {
    contactName: "Alice",
    previousScope: "Mainnet",
    scope: "Testnet",
    identifier: new Uint8Array([0xab, 0xc0, 0x02]),
    blockchainFamily: "ethereum",
    chainId: 1n,
    groupHandle: new Uint8Array([0x01, 0x02]),
    hmacProof: new Uint8Array([0x03, 0x04]),
    hmacRest: new Uint8Array(hmacRest),
  },
});

const COMPLETION = identifierCompletion([0x07, 0x08]);

const REJECTION = {
  status: DeviceActionStatus.Error,
  error: {
    _tag: "ContactsCommandError",
    errorCode: "6a80",
    message: "SWO_INCORRECT_DATA",
  },
};

const AWAITING_CONFIRMATION = {
  status: DeviceActionStatus.Pending,
  intermediateValue: { requiredUserInteraction: UserInteractionRequired.RegisterWallet },
};

function lastRejection(job: ReturnType<typeof startJob>) {
  const state = [...job.states].reverse().find(s => s.type === "device-rejected");
  if (state === undefined) throw new Error("Expected the job to have reported a rejection");
  return state;
}

describe("editExternalAddressIntentJob", () => {
  describe("an address-only edit", () => {
    it("GIVEN the device completes THEN it reports the rotated address proof", () => {
      // GIVEN
      const job = startJob();

      // WHEN
      job.emitIdentifier(COMPLETION);

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

    it("GIVEN it starts THEN it decodes both identifiers and the proofs for the kit call", () => {
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
      expect(job.editExternalAddressScope).not.toHaveBeenCalled();
    });
  });

  describe("a scope-only edit", () => {
    it("GIVEN it starts THEN it edits the scope without touching the identifier", () => {
      // WHEN
      const job = startJob(SCOPE_ONLY);

      // THEN
      expect(job.editExternalAddressIdentifier).not.toHaveBeenCalled();
      expect(job.editExternalAddressScope).toHaveBeenCalledWith({
        contactName: "Alice",
        previousScope: "Mainnet",
        newScope: "Testnet",
        // Unchanged by a scope edit, so the entry's current identifier.
        identifier: bytes(`abc0${"00".repeat(17)}01`),
        blockchainFamily: "ethereum",
        chainId: 1n,
        groupHandle: new Uint8Array([0x01, 0x02]),
        hmacProof: new Uint8Array([0x03, 0x04]),
        hmacRest: new Uint8Array([0x05, 0x06]),
        skipOpenApp: true,
      });
    });

    it("GIVEN the device completes THEN it reports the new scope and the rotated proof", () => {
      // GIVEN
      const job = startJob(SCOPE_ONLY);

      // WHEN
      job.emitScope(scopeCompletion([0x09, 0x0a]));

      // THEN
      expect(job.onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({
          scope: "Testnet",
          address: SCOPE_ONLY.previousAddress,
          hmacProof: INPUT.hmacProof,
          hmacRest: "0x090a",
        }),
      });
      expect(job.isCompleted()).toBe(true);
    });

    it("GIVEN the device requires confirmation THEN it names the scope step", () => {
      // GIVEN
      const job = startJob(SCOPE_ONLY);

      // WHEN
      job.emitScope(AWAITING_CONFIRMATION);

      // THEN
      expect(job.states).toContainEqual({
        type: "awaiting-device-confirmation",
        step: "scope",
        deviceModelId: DeviceModelId.STAX,
        deviceName: "Ledger Stax",
      });
    });
  });

  describe("a combined edit", () => {
    it("GIVEN it starts THEN it runs the identifier step first, against the scope on record", () => {
      // WHEN
      const job = startJob(COMBINED);

      // THEN
      expect(job.editExternalAddressScope).not.toHaveBeenCalled();
      expect(job.editExternalAddressIdentifier).toHaveBeenCalledWith(
        expect.objectContaining({
          // The device verifies the entry as it stands, and the scope has not
          // moved yet — sending `newScope` here would fail verification.
          scope: "Mainnet",
          previousIdentifier: bytes(`abc0${"00".repeat(17)}01`),
          newIdentifier: bytes(`abc0${"00".repeat(17)}02`),
          hmacRest: new Uint8Array([0x05, 0x06]),
        }),
      );
    });

    it("GIVEN the identifier step completes THEN it chains into the scope step with the rotated proof", () => {
      // GIVEN
      const job = startJob(COMBINED);

      // WHEN
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // THEN
      expect(job.states).toContainEqual({ type: "partial-result" });
      expect(job.editExternalAddressScope).toHaveBeenCalledWith(
        expect.objectContaining({
          previousScope: "Mainnet",
          newScope: "Testnet",
          // The identifier the device now holds, proven by the proof it just
          // returned — not the stored one, which no longer describes the entry.
          identifier: bytes(`abc0${"00".repeat(17)}02`),
          hmacRest: new Uint8Array([0x07, 0x08]),
        }),
      );
    });

    it("GIVEN the identifier step completes THEN it reports nothing yet", () => {
      // GIVEN
      const job = startJob(COMBINED);

      // WHEN
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // THEN
      // The edit resolves only once both halves are approved: a half-applied
      // edit is not something the consumer should persist.
      expect(job.onResult).not.toHaveBeenCalled();
      expect(job.states).not.toContainEqual({ type: "completed" });
      expect(job.isCompleted()).toBe(false);
    });

    it("GIVEN both steps complete THEN it reports the final scope and proof once", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.emitScope(scopeCompletion([0x09, 0x0a]));

      // THEN
      expect(job.onResult).toHaveBeenCalledTimes(1);
      expect(job.onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({
          scope: "Testnet",
          address: COMBINED.newAddress,
          hmacRest: "0x090a",
        }),
      });
      expect(job.states).toContainEqual({ type: "completed" });
      expect(job.isCompleted()).toBe(true);
    });

    it("GIVEN each step awaits confirmation THEN it names them in order", () => {
      // GIVEN
      const job = startJob(COMBINED);

      // WHEN
      job.emitIdentifier(AWAITING_CONFIRMATION);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));
      job.emitScope(AWAITING_CONFIRMATION);

      // THEN
      const steps = job.states
        .filter(s => s.type === "awaiting-device-confirmation")
        .map(s => s.step);
      expect(steps).toEqual(["identifier", "scope"]);
    });

    it("GIVEN the user gives up between the two steps THEN it cancels without reporting a partial result", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.subscription.unsubscribe();

      // THEN
      // The device records nothing, so dropping the intermediate proof leaves
      // the stored record untouched and still valid.
      expect(job.onResult).toHaveBeenCalledWith({
        type: "failure",
        error: expect.any(ContactDeviceIntentCancelledError),
      });
      expect(job.onResult).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the scope step is running WHEN the caller unsubscribes THEN it tears that step down", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.subscription.unsubscribe();

      // THEN
      // The chain hands teardown to whichever step is live, so the scope step
      // has to pair its own `cancel` with unsubscription too.
      expect(job.scopeCancel(0)).toHaveBeenCalled();
    });

    it("GIVEN the scope step's transport fails THEN it reports a terminal failure", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.failScope(new Error("transport disconnected"));

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

    it("GIVEN the scope step is stopped THEN it reports a terminal failure", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.emitScope({ status: DeviceActionStatus.Stopped });

      // THEN
      expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
      expect(job.states).toContainEqual({ type: "failed", error: expect.any(Error) });
    });

    it("GIVEN status word 0x6982 on the scope step THEN it reports existing-group-verification-failed", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.emitScope({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "ContactsCommandError",
          errorCode: "6982",
          message: "SWO_SECURITY_CONDITION_NOT_SATISFIED",
        },
      });

      // THEN
      expect(job.states).toContainEqual({
        type: "existing-group-verification-failed",
        error: expect.objectContaining({ message: "SWO_SECURITY_CONDITION_NOT_SATISFIED" }),
      });
    });

    it("GIVEN the scope step is rejected WHEN the user retries THEN it restarts from the identifier step", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));
      job.emitScope(REJECTION);

      // WHEN
      lastRejection(job).retry?.();

      // THEN
      // Restarting is safe precisely because the device kept nothing: the
      // stored proof still describes the entry, so the whole chain replays.
      expect(job.editExternalAddressIdentifier).toHaveBeenCalledTimes(2);
      expect(job.editExternalAddressIdentifier).toHaveBeenLastCalledWith(
        expect.objectContaining({
          previousIdentifier: bytes(`abc0${"00".repeat(17)}01`),
          hmacRest: new Uint8Array([0x05, 0x06]),
        }),
      );
    });

    it("GIVEN a retried chain WHEN both steps complete THEN it reports success once", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));
      job.emitScope(REJECTION);
      lastRejection(job).retry?.();

      // WHEN
      job.emitIdentifier(identifierCompletion([0x0b, 0x0c]), 1);
      job.emitScope(scopeCompletion([0x0d, 0x0e]), 1);

      // THEN
      expect(job.onResult).toHaveBeenCalledTimes(1);
      expect(job.onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({ scope: "Testnet", hmacRest: "0x0d0e" }),
      });
      expect(job.isCompleted()).toBe(true);
    });

    it("GIVEN the scope step fails terminally THEN it does not report the identifier half as a success", () => {
      // GIVEN
      const job = startJob(COMBINED);
      job.emitIdentifier(identifierCompletion([0x07, 0x08]));

      // WHEN
      job.emitScope({
        status: DeviceActionStatus.Error,
        error: { _tag: "ContactsValidationError", message: "scope too long" },
      });

      // THEN
      expect(job.onResult).toHaveBeenCalledWith({
        type: "failure",
        error: expect.objectContaining({ message: "scope too long" }),
      });
      expect(job.onResult).not.toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
      expect(job.states).toContainEqual({
        type: "invalid-input",
        error: expect.objectContaining({ message: "scope too long" }),
      });
    });
  });

  describe("an edit that changes nothing", () => {
    it("GIVEN neither field changed THEN it settles without touching the device", () => {
      // GIVEN
      const input: EditExternalAddressIntentInput = {
        ...INPUT,
        newAddress: INPUT.previousAddress,
      };

      // WHEN
      const job = startJob(input);

      // THEN
      expect(job.editExternalAddressIdentifier).not.toHaveBeenCalled();
      expect(job.editExternalAddressScope).not.toHaveBeenCalled();
      expect(job.onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({
          address: INPUT.previousAddress,
          scope: INPUT.previousScope,
          // The caller's own proof, echoed back: there was nothing to rotate.
          hmacRest: INPUT.hmacRest,
        }),
      });
      expect(job.states).toContainEqual({ type: "completed" });
      expect(job.isCompleted()).toBe(true);
    });
  });

  describe("device confirmation and failure mapping", () => {
    it("GIVEN the device requires wallet confirmation WHEN pending THEN it names the identifier step", () => {
      // GIVEN
      const job = startJob();

      // WHEN
      job.emitIdentifier(AWAITING_CONFIRMATION);

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
      job.emitIdentifier({ status: DeviceActionStatus.NotStarted });

      // THEN
      expect(job.states).toContainEqual({ type: "pending" });
    });

    it("GIVEN an unrelated pending interaction WHEN pending THEN it reports pending", () => {
      // GIVEN
      const job = startJob();

      // WHEN
      job.emitIdentifier({
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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
      job.emitIdentifier(REJECTION);

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
      job.emitIdentifier(REJECTION);

      // THEN
      expect(job.isCompleted()).toBe(false);
      expect(job.onResult).not.toHaveBeenCalled();
    });

    it("GIVEN a rejection WHEN the user retries THEN it replays the device action", () => {
      // GIVEN
      const job = startJob();
      job.emitIdentifier(REJECTION);

      // WHEN
      lastRejection(job).retry?.();

      // THEN
      expect(job.editExternalAddressIdentifier).toHaveBeenCalledTimes(2);
      expect(job.identifierCancel(0)).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a retried rejection WHEN the device confirms THEN it reports success and completes", () => {
      // GIVEN
      const job = startJob();
      job.emitIdentifier(REJECTION);
      lastRejection(job).retry?.();

      // WHEN
      job.emitIdentifier(COMPLETION, 1);

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
      job.emitIdentifier(REJECTION);

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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
      job.emitIdentifier({ status: DeviceActionStatus.Error, error });

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
        expect(job.editExternalAddressScope).not.toHaveBeenCalled();
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
      expect(job.identifierCancel(0)).toHaveBeenCalled();
      expect(job.onResult).toHaveBeenCalledWith({
        type: "failure",
        error: expect.any(ContactDeviceIntentCancelledError),
      });
    });

    it("GIVEN the device action is stopped WHEN reported THEN it reports failure", () => {
      // GIVEN
      const job = startJob();

      // WHEN
      job.emitIdentifier({ status: DeviceActionStatus.Stopped });

      // THEN
      expect(job.onResult).toHaveBeenCalledWith({ type: "failure", error: expect.any(Error) });
      expect(job.states).toContainEqual({ type: "failed", error: expect.any(Error) });
    });

    it("GIVEN the device action observable errors WHEN reported THEN it reports failure with a terminal failed state", () => {
      // GIVEN
      const job = startJob();

      // WHEN
      job.failIdentifier(new Error("transport disconnected"));

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
});
