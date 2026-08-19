import {
  asBoolean,
  asRecord,
  asString,
  extractApiMessage,
  looksAccountLocked,
  REDACTION_PLACEHOLDER,
  redactBody,
} from "./body";

describe("asRecord", () => {
  it.each([
    ["null", null],
    ["a string", "text"],
    ["an array", [1, 2]],
    ["undefined", undefined],
  ])("returns an empty object for %s", (_label, value) => {
    expect(asRecord(value)).toEqual({});
  });

  it("passes a plain object through", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
  });
});

describe("asString", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["value", "value"],
  ])("maps %p to %p", (input, expected) => {
    expect(asString(input)).toBe(expected);
  });

  it.each([[null], [undefined], [0], [false], [{}]])("rejects the non-string %p", value => {
    expect(asString(value)).toBeNull();
  });
});

describe("asBoolean", () => {
  it("keeps real booleans and rejects everything else", () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean("true")).toBeNull();
    expect(asBoolean(null)).toBeNull();
  });
});

describe("extractApiMessage", () => {
  it.each([
    [{ message: "from message" }, "from message"],
    [{ error: "from error" }, "from error"],
    [{ errorMessage: "from errorMessage" }, "from errorMessage"],
    [{ error_description: "from error_description" }, "from error_description"],
    [{ data: { message: "nested" } }, "nested"],
  ])("reads %j", (body, expected) => {
    expect(extractApiMessage(body)).toBe(expected);
  });

  it("joins an errors array", () => {
    expect(extractApiMessage({ errors: ["first", { message: "second" }] })).toBe("first; second");
  });

  it("prefers the direct message over a nested one", () => {
    expect(extractApiMessage({ message: "direct", data: { message: "nested" } })).toBe("direct");
  });

  it("returns null when there is nothing to report", () => {
    expect(extractApiMessage({ unrelated: true })).toBeNull();
    expect(extractApiMessage(null)).toBeNull();
  });
});

describe("redactBody", () => {
  it.each([
    "password",
    "Password",
    "newPassword",
    "currentPassword",
    "clientKey",
    "client_key",
    "x-client-key",
    "secret",
    "clientSecret",
    "totpSecret",
    "otpCode",
    "otp",
    "accessToken",
    "access_token",
    "refreshToken",
    "token",
    "authorization",
  ])("redacts %s regardless of case", key => {
    expect(redactBody({ [key]: "sensitive" })).toEqual({ [key]: REDACTION_PLACEHOLDER });
  });

  it("leaves harmless fields alone", () => {
    expect(redactBody({ userId: "user-1", phase: "ACCOUNT", isLinked: true })).toEqual({
      userId: "user-1",
      phase: "ACCOUNT",
      isLinked: true,
    });
  });

  it("recurses into nested objects and arrays", () => {
    const redacted = redactBody({
      data: { password: "p", items: [{ secret: "s" }, { keep: "yes" }] },
    });

    expect(redacted).toEqual({
      data: {
        password: REDACTION_PLACEHOLDER,
        items: [{ secret: REDACTION_PLACEHOLDER }, { keep: "yes" }],
      },
    });
  });

  it("passes primitives through untouched", () => {
    expect(redactBody("text")).toBe("text");
    expect(redactBody(42)).toBe(42);
    expect(redactBody(null)).toBeNull();
  });
});

describe("looksAccountLocked", () => {
  it.each([
    "Account locked",
    "your account is LOCKED",
    "Too many attempts",
    "Too many failed attempts",
    "temporarily disabled",
    "temporarily blocked",
  ])("detects %p", message => {
    expect(looksAccountLocked(message)).toBe(true);
  });

  it.each(["Incorrect email or password", "Invalid OTP code", null])(
    "does not over-match %p",
    message => {
      expect(looksAccountLocked(message)).toBe(false);
    },
  );
});
