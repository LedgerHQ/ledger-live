import { getErrorName, toError } from "./errors";

describe("getErrorName", () => {
  it("should read the name of an Error", () => {
    expect(getErrorName(new TypeError("boom"))).toBe("TypeError");
  });

  it("should read the name of a plain object", () => {
    expect(getErrorName({ name: "TrustchainNotAllowed" })).toBe("TrustchainNotAllowed");
  });

  it.each([
    ["a string", "TrustchainNotAllowed"],
    ["undefined", undefined],
    ["null", null],
    ["an object without name", { code: 42 }],
    ["an object whose name is not a string", { name: 42 }],
  ])("should return undefined for %s", (_, error) => {
    expect(getErrorName(error)).toBeUndefined();
  });
});

describe("toError", () => {
  it("should return an Error as is", () => {
    const error = new Error("boom");

    expect(toError(error)).toBe(error);
  });

  it("should wrap a string into an Error with that message", () => {
    const error = toError("boom");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
  });

  it("should keep the name and message of a plain object", () => {
    const error = toError({ name: "TrustchainNotAllowed", message: "serialized across a bridge" });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("TrustchainNotAllowed");
    expect(error.message).toBe("serialized across a bridge");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an object without message", { code: 42 }],
    ["an object whose message is not a string", { message: 42 }],
  ])("should fall back to a generic message for %s", (_, value) => {
    const error = toError(value);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("Error");
    expect(error.message).toBe("Ledger Sync device call failed");
  });
});
