/* eslint-env jest */
import { handleErrors, isHandledError } from "./handleSwapErrors";
import { IgnoredSignatureStepError, SignatureStepError } from "./SwapError";

describe("handleErrors", () => {
  it("marks default ignored message errors as handled and rethrows", async () => {
    const error = new Error("User refused");

    expect(() => handleErrors(error)).toThrow(error);
    expect(isHandledError(error)).toBe(true);
  });

  it("marks default ignored error names as handled and rethrows", async () => {
    const nestedError = new Error("Device mismatch");
    nestedError.name = "WrongDeviceForAccount";
    const error = new SignatureStepError(nestedError);

    expect(() => handleErrors(error)).toThrow(error);
    expect(isHandledError(error)).toBe(true);
  });

  it("invokes onDisplayError for swap errors that should be surfaced", async () => {
    const error = new SignatureStepError(new Error("Unexpected failure"));
    const onDisplayError = jest.fn().mockResolvedValue(undefined);

    await expect(handleErrors(error, { onDisplayError })).resolves.toBeUndefined();
    expect(onDisplayError).toHaveBeenCalledWith(error);
  });

  it("skips onDisplayError for swap003Ignored errors and marks them handled", async () => {
    const error = new IgnoredSignatureStepError(new Error("User rejected"));
    const onDisplayError = jest.fn();

    expect(() => handleErrors(error, { onDisplayError })).toThrow(error);
    expect(onDisplayError).not.toHaveBeenCalled();
    expect(isHandledError(error)).toBe(true);
  });

  it("respects custom ignored error names", async () => {
    const error = new Error("Rate limited");
    Object.assign(error, { cause: { name: "RateLimitedError" } });

    expect(() => handleErrors(error, { ignoredErrorNames: ["RateLimitedError"] })).toThrow(error);
    expect(isHandledError(error)).toBe(true);
  });
});
