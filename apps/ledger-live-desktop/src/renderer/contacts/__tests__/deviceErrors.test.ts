import { extractErrorMessage, prettyDeviceErrorMessage } from "../deviceErrors";

describe("extractErrorMessage", () => {
  it("returns Error.message for real Error instances", () => {
    expect(extractErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns the string itself when thrown value is a string", () => {
    expect(extractErrorMessage("oops")).toBe("oops");
  });

  it("returns .message for DMK tagged-object errors", () => {
    const err = {
      _tag: "EthAppCommandError",
      errorCode: "6982",
      message: "Security status not satisfied (Canceled by user)",
    };

    expect(extractErrorMessage(err)).toBe(
      "Security status not satisfied (Canceled by user)",
    );
  });

  it("falls back to JSON.stringify for plain objects with no message", () => {
    expect(extractErrorMessage({ kind: "weird" })).toBe('{"kind":"weird"}');
  });

  it("handles null / undefined / numbers without throwing", () => {
    expect(extractErrorMessage(null)).toBe("null");
    expect(extractErrorMessage(undefined)).toBe("undefined");
    expect(extractErrorMessage(42)).toBe("42");
  });
});

describe("prettyDeviceErrorMessage", () => {
  it("rewrites the DMK 'Canceled by user' SW-6982 message to a neutral one", () => {
    // DMK labels every SW-6982 the same way regardless of root cause
    // (genuine cancel, old Ethereum app, locked session, etc.) — we
    // refuse to attribute the failure to the user.
    expect(
      prettyDeviceErrorMessage("Security status not satisfied (Canceled by user)"),
    ).toBe("Device didn't approve the action");
  });

  it("also rewrites a bare 'Canceled by user' message (case-insensitive)", () => {
    expect(prettyDeviceErrorMessage("Canceled by user")).toBe(
      "Device didn't approve the action",
    );
    expect(prettyDeviceErrorMessage("canceled by user")).toBe(
      "Device didn't approve the action",
    );
  });

  it("surfaces other parenthetical reasons verbatim", () => {
    expect(prettyDeviceErrorMessage("Some prefix (Unsupported command)")).toBe(
      "Unsupported command",
    );
  });

  it("trims whitespace inside the parenthetical", () => {
    expect(prettyDeviceErrorMessage("Some prefix (  Trimmed reason  )")).toBe(
      "Trimmed reason",
    );
  });

  it("returns the message unchanged when there's no parenthetical", () => {
    expect(prettyDeviceErrorMessage("Just a plain message")).toBe(
      "Just a plain message",
    );
  });

  it("returns the message unchanged when content sits outside the parens", () => {
    // Anchored regex — only matches when the parenthetical is the
    // last thing in the string; bail out otherwise so we don't lose
    // trailing context.
    expect(
      prettyDeviceErrorMessage("Prefix (note) and then more"),
    ).toBe("Prefix (note) and then more");
  });

  it("returns the message unchanged for nested parentheses (regex is intentionally simple)", () => {
    expect(prettyDeviceErrorMessage("Outer ((nested))")).toBe(
      "Outer ((nested))",
    );
  });
});
