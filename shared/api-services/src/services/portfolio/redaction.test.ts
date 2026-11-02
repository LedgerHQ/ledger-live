import type { Action } from "@reduxjs/toolkit";
import { PORTFOLIO_REDUCER_PATH } from "./constants";
import { redactPortfolioApiAction, redactPortfolioApiState } from "./redaction";

const XPUB = "sentinel-xpub";
const ADDRESS = "sentinel-address";

describe("redactPortfolioApiAction", () => {
  it("leaves an unrelated action as it is", () => {
    const action = { type: "swapApi/executeQuery/fulfilled" } as Action;
    expect(redactPortfolioApiAction(action)).toBe(action);
  });

  it("drops registration arguments and the error body, and keeps the status and the endpoint", () => {
    const redacted = redactPortfolioApiAction({
      type: `${PORTFOLIO_REDUCER_PATH}/executeMutation/rejected`,
      payload: { status: 400, data: { address: ADDRESS } },
      error: { message: `bad ${XPUB}` },
      meta: {
        arg: { endpointName: "addRegistrations", originalArgs: { xpub: XPUB, address: ADDRESS } },
        requestId: "request-1",
      },
    });

    const record = JSON.stringify(redacted);
    expect(record).not.toContain(XPUB);
    expect(record).not.toContain(ADDRESS);
    expect(record).toContain("400");
    expect(record).toContain("addRegistrations");
    expect(record).toContain("request-1");
  });

  it("drops the cache key, which serializes the account filter", () => {
    const cacheKey = `getBalance({"account":"base:${ADDRESS}","portfolioId":"p"})`;
    const redacted = redactPortfolioApiAction({
      type: `${PORTFOLIO_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: { items: [] },
      meta: {
        arg: {
          endpointName: "getBalance",
          originalArgs: { account: `base:${ADDRESS}`, portfolioId: "p" },
          queryCacheKey: cacheKey,
        },
      },
    });

    const record = JSON.stringify(redacted);
    expect(record).not.toContain(ADDRESS);
    expect(record).not.toContain("portfolioId");
    expect(redacted.meta.arg.queryCacheKey).toBe("[REDACTED]");
    expect(record).toContain("getBalance");
  });

  it("drops a successful portfolio body", () => {
    const redacted = redactPortfolioApiAction({
      type: `${PORTFOLIO_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: { id: "p", accounts: [{ address: ADDRESS }] },
      meta: { arg: { endpointName: "getPortfolio", originalArgs: { portfolioId: "p" } } },
    });

    expect(JSON.stringify(redacted)).not.toContain(ADDRESS);
    expect(redacted.payload).toBe("[REDACTED]");
  });

  it("leaves the original action untouched", () => {
    const action = {
      type: `${PORTFOLIO_REDUCER_PATH}/executeMutation/fulfilled`,
      payload: { address: ADDRESS },
      meta: { arg: { originalArgs: { xpub: XPUB } } },
    };
    redactPortfolioApiAction(action);
    expect(action.payload.address).toBe(ADDRESS);
    expect(action.meta.arg.originalArgs.xpub).toBe(XPUB);
  });

  it("drops the request url and the response body", () => {
    const request = new Request(`https://svc.example/v1/balance?account=base:${ADDRESS}`);
    const response = new Response(JSON.stringify({ address: ADDRESS }), { status: 200 });
    const redacted = redactPortfolioApiAction({
      type: `${PORTFOLIO_REDUCER_PATH}/executeQuery/fulfilled`,
      payload: { items: [] },
      meta: {
        arg: { endpointName: "getBalance", originalArgs: { account: `base:${ADDRESS}` } },
        baseQueryMeta: { request, response },
      },
    });

    expect(redacted.meta.baseQueryMeta.request).toBe("[REDACTED]");
    expect(redacted.meta.baseQueryMeta.response).toBe("[REDACTED]");
    expect(request.url).toContain(ADDRESS);
    expect(response.status).toBe(200);
  });
});

describe("redactPortfolioApiState", () => {
  it("replaces the slice, so a cache key that names an account does not survive", () => {
    const cacheKey = `getBalance({"account":"base:${ADDRESS}","portfolioId":"p"})`;
    const state = {
      [PORTFOLIO_REDUCER_PATH]: {
        queries: {
          [cacheKey]: {
            status: "fulfilled",
            endpointName: "getBalance",
            originalArgs: { account: `base:${ADDRESS}` },
            data: { address: ADDRESS },
          },
        },
        mutations: {
          "addRegistrations(1)": { originalArgs: { xpub: XPUB }, data: { xpub: XPUB } },
        },
        provided: { Portfolio: { [cacheKey]: true } },
      },
    };

    const redacted = redactPortfolioApiState(state);

    expect(JSON.stringify(redacted)).not.toContain(ADDRESS);
    expect(JSON.stringify(redacted)).not.toContain(XPUB);
    expect(redacted[PORTFOLIO_REDUCER_PATH]).toBe("[REDACTED]");
    expect(state[PORTFOLIO_REDUCER_PATH].queries[cacheKey].originalArgs).toEqual({
      account: `base:${ADDRESS}`,
    });
  });
});
