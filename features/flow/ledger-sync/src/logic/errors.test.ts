import {
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
  KeyRingTreeNotFoundError,
} from "@features/platform-key-ring";
import {
  classifyLedgerSyncDeviceFailure,
  isLedgerSyncTreeGone,
  ledgerSyncErrorForDisplay,
} from "./errors";

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

describe("ledgerSyncErrorForDisplay", () => {
  it("should show the original protocol error when the key ring error keeps one", () => {
    const cause = namedError("TrustchainEjected", "ejected");
    expect(ledgerSyncErrorForDisplay(new KeyRingMemberRemovedError("removed", { cause }))).toBe(
      cause,
    );
  });

  it("should name the error after the category translation when there is no cause", () => {
    const displayed = ledgerSyncErrorForDisplay(new KeyRingNotAllowedError("nope"));
    expect(displayed).toBeInstanceOf(Error);
    expect(displayed.message).toBe("nope");
    expect(displayed.name).not.toBe("KeyRingNotAllowedError");
  });

  it("should keep an error that is not a key ring error", () => {
    const error = new Error("boom");
    expect(ledgerSyncErrorForDisplay(error)).toBe(error);
  });
});

describe("isLedgerSyncTreeGone", () => {
  it.each([
    ["the backend 4xx", namedError("LedgerAPI4xx", "No such trustchain 02ab")],
    ["its mapped key ring error", new KeyRingTreeNotFoundError("No such trustchain 02ab")],
  ])("should match %s while the instance is a member", (_case, error) => {
    expect(isLedgerSyncTreeGone(error, true)).toBe(true);
  });

  it("should not match a missing key tree while the instance has none", () => {
    expect(isLedgerSyncTreeGone(new KeyRingTreeNotFoundError("TrustchainNotFound"), false)).toBe(
      false,
    );
  });

  it.each([
    ["another category", new KeyRingError("not-member", "Not a member of trustchain")],
    ["the message on an error of another name", new Error("No such trustchain")],
  ])("should not match %s", (_case, error) => {
    expect(isLedgerSyncTreeGone(error, true)).toBe(false);
  });
});

describe("classifyLedgerSyncDeviceFailure", () => {
  it.each([
    "already-member",
    "member-of-other-tree",
    "not-allowed",
    "no-tree-for-seed",
    "user-refused",
    "device-unsupported",
  ] as const)("should keep the %s category", category => {
    expect(classifyLedgerSyncDeviceFailure(new KeyRingError(category))).toBe(category);
  });

  it.each(["network", "not-member", "tree-not-found"] as const)(
    "should map the %s category to other",
    category => {
      expect(classifyLedgerSyncDeviceFailure(new KeyRingError(category))).toBe("other");
    },
  );

  it("should map an error that is not a key ring error to other", () => {
    expect(classifyLedgerSyncDeviceFailure(new Error("Device not found"))).toBe("other");
  });
});
