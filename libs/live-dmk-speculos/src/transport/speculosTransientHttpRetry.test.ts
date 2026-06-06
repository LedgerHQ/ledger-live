import {
  isRetryableSpeculosHttpError,
  withTransientHttpRetries,
} from "./speculosTransientHttpRetry";

describe("isRetryableSpeculosHttpError", () => {
  it("treats an Axios ERR_NETWORK as retryable (dropped Speculos proxy socket)", () => {
    expect(
      isRetryableSpeculosHttpError({
        isAxiosError: true,
        code: "ERR_NETWORK",
        message: "Network Error",
      }),
    ).toBe(true);
  });

  it("treats a 'Network Error' message with no code as retryable", () => {
    expect(isRetryableSpeculosHttpError({ isAxiosError: true, message: "Network Error" })).toBe(
      true,
    );
  });

  it("unwraps a GeneralDmkError wrapping an ERR_NETWORK AxiosError", () => {
    expect(
      isRetryableSpeculosHttpError({
        _tag: "GeneralDmkError",
        originalError: { isAxiosError: true, code: "ERR_NETWORK", message: "Network Error" },
      }),
    ).toBe(true);
  });

  it("retries retryable HTTP statuses", () => {
    expect(isRetryableSpeculosHttpError({ isAxiosError: true, response: { status: 503 } })).toBe(
      true,
    );
  });

  it("does not retry a genuine 4xx device/protocol error", () => {
    expect(
      isRetryableSpeculosHttpError({
        isAxiosError: true,
        code: "ERR_BAD_REQUEST",
        response: { status: 400 },
      }),
    ).toBe(false);
  });

  it("does not retry a non-Axios error", () => {
    expect(isRetryableSpeculosHttpError(new Error("boom"))).toBe(false);
  });
});

describe("withTransientHttpRetries", () => {
  it("retries an ERR_NETWORK failure then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ isAxiosError: true, code: "ERR_NETWORK", message: "Network Error" })
      .mockResolvedValueOnce("ok");

    await expect(
      withTransientHttpRetries("test", fn, { maxAttempts: 3, baseDelayMs: 1 }),
    ).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-retryable error", async () => {
    const fn = jest.fn().mockRejectedValue({ isAxiosError: true, response: { status: 400 } });

    await expect(
      withTransientHttpRetries("test", fn, { maxAttempts: 3, baseDelayMs: 1 }),
    ).rejects.toEqual({ isAxiosError: true, response: { status: 400 } });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
