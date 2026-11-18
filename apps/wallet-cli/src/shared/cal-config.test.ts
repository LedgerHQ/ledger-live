import { describe, expect, it } from "bun:test";
import { remapRtkQueryError, type CryptoAssetsStore } from "@features/platform-currencies/legacy";
import { withCalServiceUrlOnFailure } from "./cal-config";
import { failedRequestHint, findFailedRequest } from "./failed-request";

const CAL_SERVICE_URL = "https://global.api.prd.ledger.com/cal";

function storeFailingWith(error: unknown): CryptoAssetsStore {
  return {
    findTokenById: () => Promise.reject(error),
    findTokenByAddressInCurrency: () => Promise.reject(error),
    getTokensSyncHash: () => Promise.reject(error),
  };
}

describe("withCalServiceUrlOnFailure", () => {
  it.each([
    ["findTokenById", (s: CryptoAssetsStore) => s.findTokenById("ethereum/erc20/usd__coin")],
    [
      "findTokenByAddressInCurrency",
      (s: CryptoAssetsStore) => s.findTokenByAddressInCurrency("0xabc", "ethereum"),
    ],
    ["getTokensSyncHash", (s: CryptoAssetsStore) => s.getTokensSyncHash("ethereum")],
  ])("names the CAL host when %s fails without a message", async (_, call) => {
    const networkDown = remapRtkQueryError({
      status: "FETCH_ERROR",
      error: "TypeError: fetch failed",
    });
    const store = withCalServiceUrlOnFailure(storeFailingWith(networkDown), CAL_SERVICE_URL);

    const error = await call(store).catch((e: unknown) => e);

    expect(error).toBe(networkDown);
    expect(findFailedRequest(error)?.host).toBe("global.api.prd.ledger.com");
  });

  it.each([
    [
      "a proxy denial",
      remapRtkQueryError({ status: 403, data: {} }),
      "Could not reach global.api.prd.ledger.com. If wallet-cli runs in a sandbox, allow global.api.prd.ledger.com in its network allowlist.",
    ],
    [
      "an unknown currency",
      remapRtkQueryError({ status: 404, data: "Currency not found: x" }),
      "Request to global.api.prd.ledger.com failed with HTTP 404.",
    ],
    [
      "a CAL outage",
      remapRtkQueryError({ status: 503, data: {} }),
      "Request to global.api.prd.ledger.com failed with HTTP 503.",
    ],
  ])("tells %s apart by its HTTP status", async (_, failure, hint) => {
    const store = withCalServiceUrlOnFailure(storeFailingWith(failure), CAL_SERVICE_URL);

    const error = await store.getTokensSyncHash("ethereum").catch((e: unknown) => e);
    const failedRequest = findFailedRequest(error);

    expect(failedRequest && failedRequestHint(failedRequest)).toBe(hint);
  });

  it("names no host for an answer it could not parse", async () => {
    const parsing = new Error("X-Ledger-Commit header not found in response");
    const store = withCalServiceUrlOnFailure(storeFailingWith(parsing), CAL_SERVICE_URL);

    const error = await store.getTokensSyncHash("ethereum").catch((e: unknown) => e);

    expect(findFailedRequest(error)).toBeUndefined();
  });

  it("keeps the url an error already carries", async () => {
    const elsewhere = Object.assign(
      remapRtkQueryError({ status: "FETCH_ERROR", error: "TypeError: fetch failed" }),
      { url: "https://elsewhere.example/" },
    );
    const store = withCalServiceUrlOnFailure(storeFailingWith(elsewhere), CAL_SERVICE_URL);

    const error = await store.findTokenById("x").catch((e: unknown) => e);

    expect(findFailedRequest(error)?.host).toBe("elsewhere.example");
  });

  it("passes results through", async () => {
    const store = withCalServiceUrlOnFailure(
      {
        findTokenById: () => Promise.resolve(undefined),
        findTokenByAddressInCurrency: () => Promise.resolve(undefined),
        getTokensSyncHash: () => Promise.resolve("hash"),
      },
      CAL_SERVICE_URL,
    );

    expect(await store.getTokensSyncHash("ethereum")).toBe("hash");
    expect(await store.findTokenById("x")).toBeUndefined();
  });
});
