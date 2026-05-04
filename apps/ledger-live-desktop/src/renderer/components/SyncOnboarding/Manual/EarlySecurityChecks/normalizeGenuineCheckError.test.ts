import { GenuineCheckFailed, NetworkDown } from "@ledgerhq/errors";
import { normalizeGenuineCheckError } from "./normalizeGenuineCheckError";

describe("normalizeGenuineCheckError", () => {
  it("should wrap the original error as GenuineCheckFailed", () => {
    const originalError = new Error("spoofed error");

    const normalizedError = normalizeGenuineCheckError(originalError);

    expect(normalizedError).toBeInstanceOf(GenuineCheckFailed);
    expect(normalizedError.cause).toBe(originalError);
  });

  it("should preserve a network error as the cause", () => {
    const originalError = new NetworkDown();

    const normalizedError = normalizeGenuineCheckError(originalError);

    expect(normalizedError).toBeInstanceOf(GenuineCheckFailed);
    expect(normalizedError.cause).toBe(originalError);
  });
});
