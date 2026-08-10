import { genericWithJWT } from "./auth";
import { TrustchainNotAllowed, TrustchainOutdated } from "./errors";
import { JWT } from "./types";

const initialJwt = { accessToken: "initial" } as unknown as JWT;
const refreshedJwt = { accessToken: "refreshed" } as unknown as JWT;
const reauthedJwt = { accessToken: "reauthed" } as unknown as JWT;

/** Shaped like @ledgerhq/live-network's LedgerAPI4xx, which always carries a status. */
function ledgerNetworkError(message: string, status = 401) {
  const error = new Error(message);
  error.name = "LedgerAPI4xx";
  Object.assign(error, { status });
  return error;
}

/** Shaped like the plain fetch errors thrown by @shared/cloud-sync. */
function fetchError(message: string, status = 401) {
  const error = new Error(message);
  error.name = "CloudSyncHttpError";
  Object.assign(error, { status });
  return error;
}

describe("genericWithJWT", () => {
  const cases = [
    ["live-network error", ledgerNetworkError],
    ["fetch error carrying a status", fetchError],
  ] as const;

  describe.each(cases)("with a %s", (_label, makeError) => {
    it("refreshes the jwt and retries the job when it expired and can be refreshed", async () => {
      const auth = jest.fn().mockResolvedValue(reauthedJwt);
      const refreshAuth = jest.fn().mockResolvedValue(refreshedJwt);
      const job = jest
        .fn()
        .mockRejectedValueOnce(makeError("JWT is expired, please call /refresh"))
        .mockResolvedValueOnce("done");

      await expect(genericWithJWT(job, initialJwt, auth, refreshAuth)).resolves.toBe("done");

      expect(refreshAuth).toHaveBeenCalledWith(initialJwt);
      expect(auth).not.toHaveBeenCalled();
      expect(job).toHaveBeenNthCalledWith(2, refreshedJwt);
    });

    it("re-authenticates and retries when the jwt expired without a refresh route", async () => {
      const auth = jest.fn().mockResolvedValue(reauthedJwt);
      const refreshAuth = jest.fn();
      const job = jest
        .fn()
        .mockRejectedValueOnce(makeError("JWT is expired"))
        .mockResolvedValueOnce("done");

      await expect(genericWithJWT(job, initialJwt, auth, refreshAuth)).resolves.toBe("done");

      expect(refreshAuth).not.toHaveBeenCalled();
      expect(auth).toHaveBeenCalledTimes(1);
      expect(job).toHaveBeenNthCalledWith(2, reauthedJwt);
    });

    it("re-authenticates and retries on an unrecognised 4xx", async () => {
      const auth = jest.fn().mockResolvedValue(reauthedJwt);
      const job = jest
        .fn()
        .mockRejectedValueOnce(makeError("Unauthorized"))
        .mockResolvedValueOnce("done");

      await expect(genericWithJWT(job, initialJwt, auth, jest.fn())).resolves.toBe("done");

      expect(auth).toHaveBeenCalledTimes(1);
      expect(job).toHaveBeenNthCalledWith(2, reauthedJwt);
    });

    it("maps a permission failure to TrustchainNotAllowed", async () => {
      const job = jest.fn().mockRejectedValue(makeError("JWT contains no permission"));

      await expect(genericWithJWT(job, initialJwt, jest.fn(), jest.fn())).rejects.toBeInstanceOf(
        TrustchainNotAllowed,
      );
      expect(job).toHaveBeenCalledTimes(1);
    });

    it("maps a path mismatch to TrustchainOutdated", async () => {
      const job = jest.fn().mockRejectedValue(makeError("path does not match"));

      await expect(genericWithJWT(job, initialJwt, jest.fn(), jest.fn())).rejects.toBeInstanceOf(
        TrustchainOutdated,
      );
    });
  });

  it("rethrows a 5xx without re-authenticating", async () => {
    const auth = jest.fn();
    const error = fetchError("Internal Server Error", 500);
    const job = jest.fn().mockRejectedValue(error);

    await expect(genericWithJWT(job, initialJwt, auth, jest.fn())).rejects.toBe(error);
    expect(auth).not.toHaveBeenCalled();
    expect(job).toHaveBeenCalledTimes(1);
  });

  it("rethrows a transport error that carries no status", async () => {
    const auth = jest.fn();
    const error = new Error("Network request failed");
    const job = jest.fn().mockRejectedValue(error);

    await expect(genericWithJWT(job, initialJwt, auth, jest.fn())).rejects.toBe(error);
    expect(auth).not.toHaveBeenCalled();
  });

  it("keys off the status rather than the error class name", async () => {
    const auth = jest.fn().mockResolvedValue(reauthedJwt);
    const namedButStatusless = new Error("JWT is expired");
    namedButStatusless.name = "LedgerAPI4xx";
    const job = jest.fn().mockRejectedValue(namedButStatusless);

    await expect(genericWithJWT(job, initialJwt, auth, jest.fn())).rejects.toBe(namedButStatusless);
    expect(auth).not.toHaveBeenCalled();
  });
});
