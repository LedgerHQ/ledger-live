import type { Action } from "@reduxjs/toolkit";
import { EARN_REDUCER_PATH } from "./constants";
import { isEarnApiAction, redactEarnApiAction, redactEarnApiState } from "./redaction";

const WALLET_ADDRESS = "sentinel-wallet-address";
const STAKE_ACCOUNT = "sentinel-stake-account";
const CACHE_KEY = `getEarnPositions({"address":"${WALLET_ADDRESS}","fresh":false,"network":"solana"})`;

describe("isEarnApiAction", () => {
  it("recognizes the actions of the Earn slice only", () => {
    expect(isEarnApiAction({ type: `${EARN_REDUCER_PATH}/executeQuery/pending` })).toBe(true);
    expect(isEarnApiAction({ type: "portfolioApi/executeQuery/pending" })).toBe(false);
  });
});

describe("redactEarnApiAction", () => {
  it("leaves an unrelated action as it is", () => {
    const action = { type: "swapApi/executeQuery/fulfilled" } as Action;
    expect(redactEarnApiAction(action)).toBe(action);
  });

  it("drops the wallet address of the request and the error body, and keeps the status and the endpoint", () => {
    const redacted = redactEarnApiAction({
      type: `${EARN_REDUCER_PATH}/executeQuery/rejected`,
      payload: { status: 503, data: { address: WALLET_ADDRESS } },
      error: { message: `failed for ${WALLET_ADDRESS}` },
      meta: {
        arg: {
          endpointName: "getEarnPositions",
          originalArgs: { network: "solana", address: WALLET_ADDRESS },
          queryCacheKey: CACHE_KEY,
        },
        requestId: "request-1",
      },
    });

    const record = JSON.stringify(redacted);
    expect(record).not.toContain(WALLET_ADDRESS);
    expect(record).toContain("503");
    expect(record).toContain("getEarnPositions");
    expect(record).toContain("request-1");
    expect(redacted.meta.arg.queryCacheKey).toBe("[REDACTED]");
  });

  it("keeps a timeout readable without its detail", () => {
    const redacted = redactEarnApiAction({
      type: `${EARN_REDUCER_PATH}/executeQuery/rejected`,
      payload: { status: "TIMEOUT_ERROR", error: "Timed out after 10000 ms" },
    });

    expect(redacted.payload).toEqual({ status: "TIMEOUT_ERROR", data: "[REDACTED]" });
  });

  it("drops the positions of a successful read, which name the wallet and its stake accounts", () => {
    const redacted = redactEarnApiAction({
      type: `${EARN_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: {
        positions: [{ id: STAKE_ACCOUNT, ownerAddress: WALLET_ADDRESS }],
        failures: [],
        isStale: false,
      },
      meta: { arg: { endpointName: "getEarnPositions", queryCacheKey: CACHE_KEY } },
    });

    const record = JSON.stringify(redacted);
    expect(record).not.toContain(WALLET_ADDRESS);
    expect(record).not.toContain(STAKE_ACCOUNT);
    expect(redacted.payload).toBe("[REDACTED]");
    expect(record).toContain("getEarnPositions");
  });

  it("drops the cache tag of an invalidation, which names the wallet address", () => {
    const redacted = redactEarnApiAction({
      type: `${EARN_REDUCER_PATH}/invalidateTags`,
      payload: [{ type: "EarnPositions", id: WALLET_ADDRESS }],
    });

    expect(JSON.stringify(redacted)).not.toContain(WALLET_ADDRESS);
  });

  it("drops the request and the response, whose body names the wallet address", () => {
    const request = new Request("https://earn.example/v3/stakes", {
      method: "POST",
      body: JSON.stringify([{ network: "solana", address: WALLET_ADDRESS }]),
    });
    const response = new Response(JSON.stringify({ data: [] }), { status: 200 });
    const redacted = redactEarnApiAction({
      type: `${EARN_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: { positions: [] },
      meta: { arg: { endpointName: "getEarnPositions" }, baseQueryMeta: { request, response } },
    });

    expect(redacted.meta.baseQueryMeta.request).toBe("[REDACTED]");
    expect(redacted.meta.baseQueryMeta.response).toBe("[REDACTED]");
    expect(response.status).toBe(200);
  });

  it("leaves the original action untouched", () => {
    const action = {
      type: `${EARN_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: { ownerAddress: WALLET_ADDRESS },
      meta: { arg: { originalArgs: { address: WALLET_ADDRESS } } },
    };

    redactEarnApiAction(action);

    expect(action.payload.ownerAddress).toBe(WALLET_ADDRESS);
    expect(action.meta.arg.originalArgs.address).toBe(WALLET_ADDRESS);
  });
});

describe("redactEarnApiState", () => {
  it("replaces the slice, so a cache key that names the wallet does not survive", () => {
    const state = {
      [EARN_REDUCER_PATH]: {
        queries: {
          [CACHE_KEY]: {
            status: "fulfilled",
            endpointName: "getEarnPositions",
            originalArgs: { address: WALLET_ADDRESS },
            data: { positions: [{ id: STAKE_ACCOUNT }] },
          },
        },
        provided: { EarnPositions: { [WALLET_ADDRESS]: [CACHE_KEY] } },
      },
      settings: { locale: "en" },
    };

    const redacted = redactEarnApiState(state);

    expect(JSON.stringify(redacted)).not.toContain(WALLET_ADDRESS);
    expect(JSON.stringify(redacted)).not.toContain(STAKE_ACCOUNT);
    expect(redacted[EARN_REDUCER_PATH]).toBe("[REDACTED]");
    expect(redacted.settings).toBe(state.settings);
    expect(state[EARN_REDUCER_PATH].queries[CACHE_KEY].originalArgs).toEqual({
      address: WALLET_ADDRESS,
    });
  });

  it("leaves a store without the Earn slice as it is", () => {
    const state = { settings: { locale: "en" } };

    expect(redactEarnApiState(state)).toBe(state);
  });
});
