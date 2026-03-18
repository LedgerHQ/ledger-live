import { ErrorWithCode } from "../fixtures/errors.fixtures";
import { withRetries } from "./withRetries";

describe("withRetries", () => {
  it("should not retry when no error thrown", async () => {
    const fn = jest.fn().mockResolvedValueOnce(undefined);
    await expect(withRetries(fn, 2, 0)).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not retry when error is not a rate limit", async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error("unit test forced error"));
    await expect(withRetries(fn, 2, 0)).rejects.toThrow("unit test forced error");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry when error is rate limit", async () => {
    const retriesCount = 2;
    const fn = jest.fn().mockRejectedValue(new ErrorWithCode(-32012));
    await expect(withRetries(fn, retriesCount, 0)).rejects.toThrow(new ErrorWithCode(-32012));
    expect(fn).toHaveBeenCalledTimes(retriesCount + 1);
  });

  it("should retry only when error is rate limit, subsequent error is thrown", async () => {
    const retriesCount = 3;
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new ErrorWithCode(-32012))
      .mockRejectedValueOnce(new Error("unit test forced error"));
    await expect(withRetries(fn, retriesCount, 0)).rejects.toThrow("unit test forced error");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
