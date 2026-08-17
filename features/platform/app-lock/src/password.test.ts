import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordLongEnough } from "./password";

describe("isPasswordLongEnough", () => {
  it("requires six characters", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
    expect(isPasswordLongEnough("12345")).toBe(false);
    expect(isPasswordLongEnough("123456")).toBe(true);
  });

  it("accepts any character class", () => {
    expect(isPasswordLongEnough("!@#$%^")).toBe(true);
    expect(isPasswordLongEnough("      ")).toBe(true);
    expect(isPasswordLongEnough("éàüñçß")).toBe(true);
  });

  it("does not trim", () => {
    expect(isPasswordLongEnough("  ab  ")).toBe(true);
    expect(isPasswordLongEnough(" abc ")).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(isPasswordLongEnough("")).toBe(false);
  });

  it("caps the length far above anything typed, since the digest is slow to derive", () => {
    expect(PASSWORD_MAX_LENGTH).toBe(128);
    expect(PASSWORD_MAX_LENGTH).toBeGreaterThan(PASSWORD_MIN_LENGTH);
  });
});
