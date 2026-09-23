import { describe, expect, it } from "bun:test";
import { SwapBackendError, toSwapBackendError } from "./swap-backend-error";

function mapped(error: unknown): Error {
  const result = toSwapBackendError(error);
  if (!result) throw new Error("expected an HTTP error to be mapped");
  return result;
}

function httpError(status: number, data?: unknown): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    name: "AxiosError",
    isAxiosError: true,
    response: { status, data },
  });
}

describe("toSwapBackendError", () => {
  it("replaces a bare HTTP failure with a SwapBackendError that hides the status from the message", () => {
    const error = mapped(httpError(401));

    expect(error).toBeInstanceOf(SwapBackendError);
    expect(error).toMatchObject({ httpStatus: 401 });
    expect(error.message).toBe("The swap provider rejected the request.");
  });

  it.each([429, 502, 503])(
    "reports HTTP %i as a temporary outage rather than a rejection",
    status => {
      const error = mapped(httpError(status, "<html>Bad Gateway</html>"));

      expect(error).toMatchObject({ httpStatus: status });
      expect(error.message).toBe("The swap service is temporarily unavailable, try again later.");
    },
  );

  it("keeps the HTTP error as the cause", () => {
    const original = httpError(401);

    expect(mapped(original).cause).toBe(original);
  });

  it("surfaces the backend message from an error object body", () => {
    const error = mapped(
      httpError(401, { error: { message: "Amount exceeds the refund account balance" } }),
    );

    expect(error.message).toBe(
      "The swap provider rejected the request: Amount exceeds the refund account balance",
    );
  });

  it("surfaces the backend message from a string body", () => {
    const error = mapped(httpError(400, { error: "invalid refund address" }));

    expect(error.message).toBe("The swap provider rejected the request: invalid refund address");
  });

  it("maps a known swap API error code to its live-common error class", () => {
    const error = mapped(
      httpError(400, { errorCode: 300, errorMessage: "ethereum not supported" }),
    );

    expect(error.name).toBe("CurrencyNotSupportedError");
    expect(error.message).toBe("ethereum not supported");
  });

  it("keeps the HTTP error as the cause of a mapped live-common error", () => {
    const original = httpError(400, { errorCode: 300, errorMessage: "ethereum not supported" });

    expect(mapped(original).cause).toBe(original);
  });

  it("leaves errors without an HTTP response to the caller", () => {
    expect(toSwapBackendError(new Error("connect ECONNREFUSED"))).toBeUndefined();
  });
});
