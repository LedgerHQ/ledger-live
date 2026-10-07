import { LedgerAPI5xx, NetworkDown } from "@ledgerhq/live-common/errors";
import { normalizeScanError } from "./normalizeScanError";

const makeEthersError = (message: string, code: string) =>
  Object.assign(new Error(message), { code });

describe("normalizeScanError", () => {
  it("maps an ethers SERVER_ERROR with an HTML body to a concise LedgerAPI5xx", () => {
    const raw = makeEthersError(
      'server response 500 (request={ }, info={ "responseBody": "<!DOCTYPE html>" }, code=SERVER_ERROR, version=6.15.0)',
      "SERVER_ERROR",
    );
    const result = normalizeScanError(raw);
    expect(result).toBeInstanceOf(LedgerAPI5xx);
    expect(result.message).toBe("HTTP 500");
  });

  it("maps network errors to NetworkDown", () => {
    expect(
      normalizeScanError(makeEthersError("could not detect network", "NETWORK_ERROR")),
    ).toBeInstanceOf(NetworkDown);
    expect(normalizeScanError(makeEthersError("timeout", "TIMEOUT"))).toBeInstanceOf(NetworkDown);
  });

  it("passes known Ledger errors through untouched", () => {
    const err = Object.assign(new Error("restricted"), { name: "CurrencyRegionRestrictedError" });
    expect(normalizeScanError(err)).toBe(err);
  });

  it("passes unknown errors through untouched", () => {
    const err = new Error("boom");
    expect(normalizeScanError(err)).toBe(err);
  });

  it("wraps non-Error values", () => {
    expect(normalizeScanError("oops")).toBeInstanceOf(Error);
  });
});
