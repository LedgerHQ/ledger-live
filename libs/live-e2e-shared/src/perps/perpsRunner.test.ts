import assert from "node:assert/strict";
import test from "node:test";
import type { PerpsAction, PerpsOrder, PerpsPosition } from "./perpsApi";
import {
  PerpsRunner,
  resolveRunOptions,
  type PerpsRunnerApi,
  type PerpsSigner,
} from "./perpsRunner";

const ADDRESS = "0x30Fb429E206729962c548b9a8d7E79095cC7E0E2";
const XYZ_MARKET = "hyperliquid-xyz-xyz:gold-usdc";
const FAST_POLLING = { intervalMs: 0, attempts: 2 };

type Call = { method: string; args: unknown[] };

/** Records calls; positions empty out once closed unless `sticky`. */
function fakeApi({
  positions = [],
  orders = [],
  sticky = false,
}: { positions?: PerpsPosition[]; orders?: PerpsOrder[]; sticky?: boolean } = {}) {
  const calls: Call[] = [];
  let open = [...positions];
  const api: PerpsRunnerApi = {
    getPositions: async (...args) => {
      calls.push({ method: "getPositions", args });
      return open;
    },
    getOrders: async (...args) => {
      calls.push({ method: "getOrders", args });
      return orders;
    },
    createAction: async request => {
      calls.push({ method: "createAction", args: [request] });
      const action: PerpsAction = {
        id: `a-${calls.length}`,
        status: "CREATED",
        signedMetadata: "0x01",
        transactions: [{ id: `t-${calls.length}` }],
      };
      return action;
    },
    submitTransaction: async (...args) => {
      calls.push({ method: "submitTransaction", args });
    },
    waitForAction: async (...args) => {
      calls.push({ method: "waitForAction", args });
      if (!sticky) open = [];
    },
  };
  return { api, calls };
}

const signer: PerpsSigner = { sign: async ({ transactions }) => transactions.map(() => "0xsig") };
const methods = (calls: Call[]) => calls.map(({ method }) => method);

const position: PerpsPosition = {
  providerId: "hyperliquid-xyz",
  marketId: XYZ_MARKET,
  side: "long",
  size: "1",
};

test("resolveRunOptions forces a dry run for sign-check only", () => {
  assert.equal(resolveRunOptions({ flow: "sign-check", address: ADDRESS }).dryRun, true);
  assert.equal(resolveRunOptions({ flow: "sweep", address: ADDRESS }).dryRun, undefined);
});

test("signCheck signs an order but never submits it", async () => {
  const { api, calls } = fakeApi();
  await new PerpsRunner(api, signer, {
    flow: "sign-check",
    address: ADDRESS,
    dryRun: false,
  }).signCheck();
  assert.deepEqual(methods(calls), ["createAction"]);
});

test("run refuses to submit an open order", async () => {
  const { api, calls } = fakeApi();
  const runner = new PerpsRunner(api, signer, { flow: "sweep", address: ADDRESS });
  await assert.rejects(
    runner.run({ providerId: "hyperliquid", address: ADDRESS, action: "open", args: {} }),
    /Refusing to submit "open"/,
  );
  assert.deepEqual(calls, []);
});

test("sweep scopes both reads to the markets and cancels after closing", async () => {
  const order: PerpsOrder = {
    providerId: "hyperliquid-xyz",
    marketId: XYZ_MARKET,
    cancelArgs: { marketId: XYZ_MARKET, orderId: "7" },
  };
  const { api, calls } = fakeApi({ positions: [position], orders: [order] });

  await new PerpsRunner(api, signer, { flow: "sweep", address: ADDRESS }).sweep([XYZ_MARKET]);

  assert.deepEqual(methods(calls), [
    "getPositions",
    "createAction",
    "submitTransaction",
    "waitForAction",
    "getOrders",
    "createAction",
    "submitTransaction",
    "waitForAction",
  ]);
  assert.deepEqual(calls[0].args, [ADDRESS, [XYZ_MARKET]]);
  assert.deepEqual(calls[4].args, [ADDRESS, [XYZ_MARKET]]);
  assert.deepEqual(
    calls.filter(({ method }) => method === "createAction").map(({ args }) => args[0]),
    [
      {
        providerId: "hyperliquid-xyz",
        address: ADDRESS,
        action: "close",
        args: { marketId: XYZ_MARKET },
      },
      {
        providerId: "hyperliquid-xyz",
        address: ADDRESS,
        action: "cancelOrder",
        args: order.cancelArgs,
      },
    ],
  );
});

test("sweep in dry run signs without submitting", async () => {
  const { api, calls } = fakeApi({ positions: [position] });
  await new PerpsRunner(api, signer, { flow: "sweep", address: ADDRESS, dryRun: true }).sweep();
  assert.deepEqual(methods(calls), ["getPositions", "createAction", "getOrders"]);
});

test("closeMarkets returns once the markets hold no position", async () => {
  const { api } = fakeApi({ positions: [position] });
  await new PerpsRunner(
    api,
    signer,
    { flow: "sweep", address: ADDRESS },
    FAST_POLLING,
  ).closeMarkets([XYZ_MARKET]);
});

test("closeMarkets fails when a position stays open", async () => {
  const { api } = fakeApi({ positions: [position], sticky: true });
  await assert.rejects(
    new PerpsRunner(api, signer, { flow: "sweep", address: ADDRESS }, FAST_POLLING).closeMarkets([
      XYZ_MARKET,
    ]),
    /Positions still open on hyperliquid-xyz-xyz:gold-usdc/,
  );
});

test("closeMarkets with no market touches nothing", async () => {
  const { api, calls } = fakeApi({ positions: [position] });
  await new PerpsRunner(api, signer, { flow: "sweep", address: ADDRESS }).closeMarkets([]);
  assert.deepEqual(calls, []);
});
