import { describe, expect, it } from "bun:test";
import type { CryptoAssetsStore } from "@features/platform-currencies/legacy";
import { withCalServiceUrlOnFailure } from "./cal-config";
import { findFailedRequest } from "./failed-request";

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
    const networkDown = Object.assign(new Error(""), { name: "NetworkDown" });
    const store = withCalServiceUrlOnFailure(storeFailingWith(networkDown), CAL_SERVICE_URL);

    const error = await call(store).catch((e: unknown) => e);

    expect(error).toBe(networkDown);
    expect(findFailedRequest(error)?.host).toBe("global.api.prd.ledger.com");
  });

  it("keeps the url an error already carries", async () => {
    const elsewhere = Object.assign(new Error("x"), { url: "https://elsewhere.example/" });
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
