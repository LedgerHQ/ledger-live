import { classifyBiometricsPromptError } from "./promptError";

describe("classifyBiometricsPromptError", () => {
  it("reads the platform error code before the message", () => {
    expect(classifyBiometricsPromptError({ code: -128, message: "lockout" })).toBe("cancelled");
    expect(classifyBiometricsPromptError({ code: "ERROR_LOCKOUT" })).toBe("lockedOut");
    expect(classifyBiometricsPromptError({ code: "13" })).toBe("cancelled");
  });

  it("falls back to the message when no code is carried", () => {
    expect(classifyBiometricsPromptError(new Error("User canceled the operation"))).toBe(
      "cancelled",
    );
    expect(classifyBiometricsPromptError(new Error("Authentication cancelled"))).toBe("cancelled");
    expect(classifyBiometricsPromptError(new Error("Too many attempts. Try again later."))).toBe(
      "lockedOut",
    );
  });

  it("counts a wrong face or finger as a failure, not a cancellation", () => {
    expect(
      classifyBiometricsPromptError(
        new Error("The user name or passphrase you entered is not correct."),
      ),
    ).toBe("failed");
    expect(classifyBiometricsPromptError(new Error("Authentication failed"))).toBe("failed");
  });

  it("treats anything it cannot read as a failure", () => {
    expect(classifyBiometricsPromptError(undefined)).toBe("failed");
    expect(classifyBiometricsPromptError("cancelled")).toBe("failed");
    expect(classifyBiometricsPromptError({ code: {} })).toBe("failed");
  });
});
