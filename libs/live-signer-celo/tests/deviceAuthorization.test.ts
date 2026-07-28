import {
  SW_DERIVATION_PATH_UNAUTHORIZED,
  isUnauthorizedPathError,
  isVersionBelow,
} from "../src/deviceAuthorization";

describe("isVersionBelow", () => {
  it.each([
    ["1.3.2", "1.7.0", true],
    ["1.6.9", "1.7.0", true],
    ["1.7.0", "1.7.0", false],
    ["1.7.1", "1.7.0", false],
    ["2.0.0", "1.7.0", false],
    ["1.10.0", "1.7.0", false], // numeric, not lexicographic
  ])("isVersionBelow(%s, %s) === %s", (version, min, expected) => {
    expect(isVersionBelow(version, min)).toBe(expected);
  });
});

describe("isUnauthorizedPathError", () => {
  it("is true for a TransportStatusError with statusCode 0x6a15", () => {
    expect(
      isUnauthorizedPathError({
        name: "TransportStatusError",
        statusCode: SW_DERIVATION_PATH_UNAUTHORIZED,
      }),
    ).toBe(true);
  });

  it("is false for a different status code", () => {
    expect(isUnauthorizedPathError({ name: "TransportStatusError", statusCode: 0x6a80 })).toBe(
      false,
    );
  });

  it("is false for a non-transport error", () => {
    expect(isUnauthorizedPathError(new Error("boom"))).toBe(false);
  });

  it("is false for null/undefined", () => {
    expect(isUnauthorizedPathError(null)).toBe(false);
    expect(isUnauthorizedPathError(undefined)).toBe(false);
  });
});
