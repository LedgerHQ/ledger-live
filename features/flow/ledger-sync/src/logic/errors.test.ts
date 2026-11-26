import {
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
} from "@features/platform-key-ring";
import {
  LedgerSyncErrorMessage,
  classifyLedgerSyncDeviceFailure,
  isNoTrustchainError,
  isUnauthorizedMemberError,
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

describe("isNoTrustchainError", () => {
  it("should match a message that includes the no trustchain message", () => {
    expect(isNoTrustchainError(new Error(`API: ${LedgerSyncErrorMessage.noTrustchain} 42`))).toBe(
      true,
    );
  });

  it("should not match another message", () => {
    expect(isNoTrustchainError(new Error("Network down"))).toBe(false);
  });
});

describe("isUnauthorizedMemberError", () => {
  it.each(["Not a member of trustchain", "You are not member"])(
    "should match a 4xx API error saying %s",
    message => {
      expect(isUnauthorizedMemberError(namedError("LedgerAPI4xx", message))).toBe(true);
    },
  );

  it("should not match the same message from another error", () => {
    expect(isUnauthorizedMemberError(new Error("You are not member"))).toBe(false);
  });
});

describe("classifyLedgerSyncDeviceFailure", () => {
  it.each([
    "already-member",
    "member-of-other-tree",
    "not-allowed",
    "no-tree-for-seed",
    "user-refused",
  ] as const)("should keep the %s category", category => {
    expect(classifyLedgerSyncDeviceFailure(new KeyRingError(category))).toBe(category);
  });

  it("should map any other key ring category to other", () => {
    expect(classifyLedgerSyncDeviceFailure(new KeyRingError("network"))).toBe("other");
  });

  it("should map an error that is not a key ring error to other", () => {
    expect(classifyLedgerSyncDeviceFailure(new Error("Device not found"))).toBe("other");
  });
});
