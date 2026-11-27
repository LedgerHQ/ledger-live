import assert from "node:assert/strict";
import test from "node:test";
import { assertSubmittable, cancelRequests, closeRequests, providerOf } from "./perpsRequests";

const ADDRESS = "0x30Fb429E206729962c548b9a8d7E79095cC7E0E2";

test("closeRequests closes every position on its own provider", () => {
  assert.deepEqual(
    closeRequests(ADDRESS, [
      {
        providerId: "hyperliquid-xyz",
        marketId: "hyperliquid-xyz-xyz:gold-usdc",
        side: "long",
        size: "1",
      },
    ]),
    [
      {
        providerId: "hyperliquid-xyz",
        address: ADDRESS,
        action: "close",
        args: { marketId: "hyperliquid-xyz-xyz:gold-usdc" },
      },
    ],
  );
});

test("cancelRequests reuses the cancel arguments the API offers", () => {
  const cancelArgs = { marketId: "hyperliquid-btc-usdc", orderId: "42" };
  assert.deepEqual(
    cancelRequests(ADDRESS, [
      { providerId: "hyperliquid", marketId: "hyperliquid-btc-usdc", cancelArgs },
    ]),
    [{ providerId: "hyperliquid", address: ADDRESS, action: "cancelOrder", args: cancelArgs }],
  );
});

test("providerOf maps HIP-3 markets to their provider", () => {
  assert.equal(providerOf("hyperliquid-xyz-xyz:xyz100-usdc"), "hyperliquid-xyz");
  assert.equal(providerOf("hyperliquid-btc-usdc"), "hyperliquid");
});

test("assertSubmittable only lets close and cancel reach the exchange", () => {
  assert.doesNotThrow(() => assertSubmittable("close", false));
  assert.doesNotThrow(() => assertSubmittable("cancelOrder", false));
  assert.throws(() => assertSubmittable("open", false), /Refusing to submit/);
  assert.doesNotThrow(() => assertSubmittable("open", true));
});
