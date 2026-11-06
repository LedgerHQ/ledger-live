import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainEjected,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { isUserRefusedOnDevice, mapLedgerSyncErrorToFailure } from "./failure";

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("mapLedgerSyncErrorToFailure", () => {
  it.each([
    [new TrustchainAlreadyInitialized(), "already-secured-same-seed"],
    [new TrustchainAlreadyInitializedWithOtherSeed(), "already-secured-other-seed"],
    [new TrustchainNotAllowed(), "not-allowed"],
    [new NoTrustchainInitialized(), "no-trustchain"],
  ] as const)("should map %s to its reason", (error, reason) => {
    expect(mapLedgerSyncErrorToFailure(error)).toEqual({ type: "failed", reason, error });
  });

  it("should match on the name, not the class", () => {
    const error = { name: "TrustchainNotAllowed", message: "serialized across a bridge" };

    const failure = mapLedgerSyncErrorToFailure(error);

    expect(failure.reason).toBe("not-allowed");
    expect(failure.error).toBeInstanceOf(Error);
    expect(failure.error.name).toBe("TrustchainNotAllowed");
    expect(failure.error.message).toBe("serialized across a bridge");
  });

  it.each([
    ["another Ledger Sync error", new TrustchainEjected()],
    ["a refusal, which is not a failure", namedError("UserRefusedOnDevice")],
    ["a plain error", new Error("network down")],
  ])("should map %s to unknown", (_, error) => {
    expect(mapLedgerSyncErrorToFailure(error)).toEqual({
      type: "failed",
      reason: "unknown",
      error,
    });
  });

  it.each([
    ["a string", "boom"],
    ["undefined", undefined],
    ["null", null],
    ["an object without name", { code: 42 }],
  ])("should wrap %s into an Error", (_, error) => {
    const failure = mapLedgerSyncErrorToFailure(error);

    expect(failure.reason).toBe("unknown");
    expect(failure.error).toBeInstanceOf(Error);
  });
});

describe("isUserRefusedOnDevice", () => {
  it("should recognise the SDK refusal by its name", () => {
    expect(isUserRefusedOnDevice(namedError("UserRefusedOnDevice"))).toBe(true);
  });

  it.each([
    new TrustchainNotAllowed(),
    new Error("UserRefusedOnDevice"),
    null,
    "UserRefusedOnDevice",
  ])("should not match %p", error => {
    expect(isUserRefusedOnDevice(error)).toBe(false);
  });
});
