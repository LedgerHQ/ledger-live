import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSubmittable,
  cancelRequests,
  closeRequests,
  openRequest,
  providerOf,
} from "./perpsRequests";

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
  assert.doesNotThrow(() => assertSubmittable("open", false, true));
});

test("openRequest builds the live app market order", () => {
  assert.deepEqual(
    openRequest(ADDRESS, {
      marketId: "hyperliquid-xyz-xyz:xyz100-usdc",
      side: "long",
      marginUsd: 5,
      leverage: 3,
    }),
    {
      providerId: "hyperliquid-xyz",
      address: ADDRESS,
      action: "open",
      args: {
        marketId: "hyperliquid-xyz-xyz:xyz100-usdc",
        side: "long",
        amount: "5.000000",
        marginMode: "isolated",
        leverage: 3,
      },
    },
  );
});

test("openRequest refuses a margin above the cap", () => {
  const order = { marketId: "hyperliquid-btc-usdc", side: "long", leverage: 2 } as const;
  assert.throws(() => openRequest(ADDRESS, { ...order, marginUsd: 10.01 }), RangeError);
  assert.throws(() => openRequest(ADDRESS, { ...order, marginUsd: 0 }), RangeError);
});
