import type { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import { cryptoAssetsApi, extractPersistedCALFromState } from "@domain/api-currency-token";
import { setKey } from "~/renderer/storage";
import type { State } from "../../reducers";
import DBMiddleware, { disable, flushCryptoAssetsCache } from "../db";

jest.mock("~/renderer/storage", () => ({
  setKey: jest.fn(),
}));

jest.mock("@domain/api-currency-token", () => ({
  ...jest.requireActual("@domain/api-currency-token"),
  extractPersistedCALFromState: jest.fn(),
  persistedCALContentEqual: jest.fn(() => false),
}));

const mockedSetKey = jest.mocked(setKey);
const mockedExtract = jest.mocked(extractPersistedCALFromState);

function updateCryptoAssets(tokenId: string) {
  mockedExtract.mockReturnValue({ tokens: [{ id: tokenId }] } as never);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const store = { getState: () => ({}) as State } as MiddlewareAPI<Dispatch, State>;
  const next = jest.fn((action: unknown) => action);
  DBMiddleware(store)(next)(cryptoAssetsApi.util.upsertQueryEntries([]) as UnknownAction);
}

describe("DBMiddleware - throttled crypto assets cache", () => {
  let startOfTheThrottleWindow = 0;

  beforeEach(() => {
    startOfTheThrottleWindow += 60_000;
    jest.useFakeTimers({ now: startOfTheThrottleWindow });
    mockedSetKey.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("writes the throttled save at once on flush", () => {
    updateCryptoAssets("first");
    updateCryptoAssets("second");
    expect(mockedSetKey).toHaveBeenCalledTimes(1);

    flushCryptoAssetsCache();

    expect(mockedSetKey).toHaveBeenLastCalledWith("app", "cryptoAssets", {
      tokens: [{ id: "second" }],
    });
  });

  it("drops the throttled save on a hard reset", () => {
    updateCryptoAssets("first");
    updateCryptoAssets("second");

    disable();
    jest.advanceTimersByTime(10_000);

    expect(mockedSetKey).toHaveBeenCalledTimes(1);
  });
});
