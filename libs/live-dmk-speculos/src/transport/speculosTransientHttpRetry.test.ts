import { DmkNetworkClientError, GeneralDmkError } from "@ledgerhq/device-management-kit";
import {
  isRetryableSpeculosHttpError,
  withTransientHttpRetries,
} from "./speculosTransientHttpRetry";

const httpError = (status: number) =>
  new DmkNetworkClientError({ message: `HTTP error ${status}`, status });

describe("isRetryableSpeculosHttpError", () => {
  it("retries a Speculos 503 that DMK wraps in a GeneralDmkError", () => {
    expect(isRetryableSpeculosHttpError(new GeneralDmkError(httpError(503)))).toBe(true);
  });

  it("retries a DMK request that timed out", () => {
    const timeout = new DmkNetworkClientError({ message: "Request timed out", isTimeout: true });

    expect(isRetryableSpeculosHttpError(timeout)).toBe(true);
  });

  it("retries a fetch failure caused by a reset connection", () => {
    const reset = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
    const fetchFailure = new DmkNetworkClientError({
      message: "fetch failed",
      cause: new TypeError("fetch failed", { cause: reset }),
    });

    expect(isRetryableSpeculosHttpError(fetchFailure)).toBe(true);
  });

  it("does not retry a Speculos 404", () => {
    expect(isRetryableSpeculosHttpError(new GeneralDmkError(httpError(404)))).toBe(false);
  });
});

describe("withTransientHttpRetries", () => {
  it("calls again after a Speculos 503 and returns the next result", async () => {
    const sendApdu = jest
      .fn()
      .mockRejectedValueOnce(new GeneralDmkError(httpError(503)))
      .mockResolvedValueOnce("9000");

    await expect(withTransientHttpRetries("apdu", sendApdu, { baseDelayMs: 0 })).resolves.toBe(
      "9000",
    );
    expect(sendApdu).toHaveBeenCalledTimes(2);
  });

  it("gives up at once on a Speculos 404", async () => {
    const notFound = new GeneralDmkError(httpError(404));
    const sendApdu = jest.fn().mockRejectedValue(notFound);

    await expect(withTransientHttpRetries("apdu", sendApdu, { baseDelayMs: 0 })).rejects.toBe(
      notFound,
    );
    expect(sendApdu).toHaveBeenCalledTimes(1);
  });
});
