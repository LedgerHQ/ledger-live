import type { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import { portfolioListed } from "@features/platform-account-source-portfolio";
import { CARD_REDUCER_PATH, PORTFOLIO_REDUCER_PATH } from "@shared/api-services";
import logger from "~/renderer/logger";
import type { State } from "../../reducers";
import loggerMiddleware from "../logger";

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { onReduxAction: jest.fn() },
}));

const ACCESS_TOKEN = "sentinel-access-token";
const REFRESH_TOKEN = "sentinel-refresh-token";
const CODE_VERIFIER = "sentinel-code-verifier";

const onReduxAction = jest.mocked(logger.onReduxAction);

function runMiddleware(action: unknown) {
  const store = {
    getState: () => ({}) as State,
    dispatch: jest.fn(),
  } as MiddlewareAPI<Dispatch<UnknownAction>, State>;
  const next = jest.fn(() => action);

  const result = loggerMiddleware(store)(next)(action);
  return { next, result };
}

function loggedRecord(): string {
  return JSON.stringify(onReduxAction.mock.calls[0][0]);
}

describe("loggerMiddleware", () => {
  beforeEach(() => {
    onReduxAction.mockReset();
  });

  it("drops the addresses and the portfolio id the Portfolio source records", () => {
    const address = "0xabababababababababababababababababababab";
    runMiddleware(
      portfolioListed({
        portfolioId: "sentinel-portfolio",
        portfolio: { id: "sentinel-portfolio", registrations: [{ id: "r", type: "evm", address }] },
        at: 0,
      }),
    );

    const record = loggedRecord();
    expect(record).not.toContain(address);
    expect(record).not.toContain("sentinel-portfolio");
    expect(record).toContain(portfolioListed.type);
  });

  it("drops the credentials a Card mutation carries, and keeps the endpoint name", () => {
    runMiddleware({
      type: `${CARD_REDUCER_PATH}/executeMutation/fulfilled`,
      payload: {
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        expiresIn: 3600,
      },
      meta: {
        arg: {
          endpointName: "exchangeAuthorizationCode",
          originalArgs: { code: "a-code", codeVerifier: CODE_VERIFIER },
        },
        requestId: "request-1",
      },
    });

    const record = loggedRecord();
    expect(record).not.toContain(ACCESS_TOKEN);
    expect(record).not.toContain(REFRESH_TOKEN);
    expect(record).not.toContain(CODE_VERIFIER);
    expect(record).toContain("exchangeAuthorizationCode");
    expect(record).toContain("request-1");
  });

  it("keeps a rejected Card action readable without its error detail", () => {
    runMiddleware({
      type: `${CARD_REDUCER_PATH}/executeQuery/rejected`,
      payload: { status: 401, data: { token: ACCESS_TOKEN } },
      error: { message: `failed with ${ACCESS_TOKEN}` },
      meta: { arg: { endpointName: "getUser" }, requestId: "request-2" },
    });

    const record = loggedRecord();
    expect(record).not.toContain(ACCESS_TOKEN);
    expect(record).toContain("401");
    expect(record).toContain("getUser");
  });

  it("logs a non-Card RTK Query action unchanged", () => {
    const action = {
      type: "swapApi/executeQuery/fulfilled",
      meta: {
        arg: { endpointName: "getQuotes", originalArgs: { from: "bitcoin" } },
        requestId: "request-3",
      },
    };

    runMiddleware(action);

    expect(onReduxAction).toHaveBeenCalledWith(action);
  });

  it("drops portfolio arguments, error bodies and the cache key before they are logged", () => {
    const xpub = "sentinel-xpub";
    const address = "sentinel-address";
    runMiddleware({
      type: `${PORTFOLIO_REDUCER_PATH}/executeQuery/rejected`,
      payload: { status: 400, data: { address } },
      error: { message: `bad ${xpub}` },
      meta: {
        arg: {
          endpointName: "getBalance",
          originalArgs: { xpub, address },
          queryCacheKey: `getBalance({"account":"base:${address}","portfolioId":"p"})`,
        },
        requestId: "request-p",
      },
    });

    const record = loggedRecord();
    expect(record).not.toContain(xpub);
    expect(record).not.toContain(address);
    expect(record).not.toContain("portfolioId");
    expect(record).toContain("getBalance");
    expect(record).toContain("400");
  });

  it("passes the whole Card action on to the reducers", () => {
    const action = {
      type: `${CARD_REDUCER_PATH}/executeMutation/fulfilled`,
      payload: { accessToken: ACCESS_TOKEN },
      meta: { arg: { originalArgs: { codeVerifier: CODE_VERIFIER } } },
    };

    const { next, result } = runMiddleware(action);

    expect(next).toHaveBeenCalledWith(action);
    expect(result).toBe(action);
  });

  it("ignores an action without a type", () => {
    const { next } = runMiddleware({ payload: ACCESS_TOKEN });

    expect(onReduxAction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
