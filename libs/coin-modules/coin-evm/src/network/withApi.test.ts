/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { AssertionError } from "node:assert";
import { FetchRequest, JsonRpcProvider } from "ethers";
import { DEFAULT_RETRIES_RPC_METHODS, withApi } from "./withApi";
import { makeUniqueRandomCurrency, makeUniqueRandomNodeConfig } from "../fixtures/common.fixtures";
import { withRetries } from "./withRetries";
import {
  AxiosLikeError,
  ErrorWithCode,
  ErrorWithResponseStatus,
} from "../fixtures/errors.fixtures";

jest.mock("./withRetries", () => {
  const originalModule = jest.requireActual("./withRetries");
  return {
    ...originalModule,
    withRetries: jest.fn().mockImplementation(originalModule.withRetries),
  };
});

const mockWithRetries = jest.mocked(withRetries);

describe("withApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not retry when we pass retries as 0", async () => {
    const spy = jest
      .fn()
      .mockRejectedValueOnce(new Error("Error thrown to force quit the function"));

    await expect(
      withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig({ retries: 0 })),
    ).rejects.toThrow("Error thrown to force quit the function");

    expect(mockWithRetries).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not retry when error is not a rate limit", async () => {
    const spy = jest
      .fn()
      .mockRejectedValueOnce(new Error("Error thrown to force quit the function"));

    await expect(
      withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig({ retries: 2 })),
    ).rejects.toThrow("Error thrown to force quit the function");

    expect(mockWithRetries).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should retry we detect a RPC rate limit not handled by etherjs", async () => {
    const spy = jest.fn().mockRejectedValue(new ErrorWithCode(-32012));

    await expect(
      withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig({ retries: 2 })),
    ).rejects.toThrow(new ErrorWithCode(-32012));

    expect(mockWithRetries).toHaveBeenCalledTimes(1);
    expect(mockWithRetries).toHaveBeenCalledWith(expect.any(Function), 1, 100);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("should retry we detect a HTTP rate limit not handled by etherjs", async () => {
    const spy = jest.fn().mockRejectedValue(new AxiosLikeError({ status: 429 }));

    await expect(
      withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig({ retries: 2 })),
    ).rejects.toThrow(new AxiosLikeError({ status: 429 }));

    expect(mockWithRetries).toHaveBeenCalledTimes(1);
    expect(mockWithRetries).toHaveBeenCalledWith(expect.any(Function), 1, 100);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("should not retry when ethersjs has already retried", async () => {
    const spy = jest
      .fn()
      .mockRejectedValue(new ErrorWithResponseStatus("exceeded maximum retry limit"));

    await expect(
      withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig({ retries: 2 })),
    ).rejects.toThrow(new ErrorWithResponseStatus("exceeded maximum retry limit"));

    expect(mockWithRetries).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should throw after too many retries", async () => {
    const SpyError = class SpyError extends Error {};

    let retries = DEFAULT_RETRIES_RPC_METHODS + 1;
    const spy = jest.fn(async () => {
      if (retries) {
        --retries;
        throw new SpyError();
      }
      return true;
    });

    try {
      await withApi(makeUniqueRandomCurrency(), spy, makeUniqueRandomNodeConfig());
      fail("Promise should have been rejected");
    } catch (e) {
      if (e instanceof AssertionError) {
        throw e;
      }
      expect(e).toBeInstanceOf(SpyError);
    }
  });

  it("provider cache should reuse the same JsonRpcProvider for the same currency id and same uri", async () => {
    const currency = makeUniqueRandomCurrency();
    const nodeConfig = makeUniqueRandomNodeConfig();
    const execute = (api: JsonRpcProvider) => Promise.resolve(api);
    const first = await withApi(currency, execute, nodeConfig);
    const second = await withApi(currency, execute, nodeConfig);

    expect(first).toBe(second);
    expect(first).toBeInstanceOf(JsonRpcProvider);
  });

  it("provider cache should use distinct JsonRpcProviders for the same currency id but different uri", async () => {
    const currency = makeUniqueRandomCurrency();

    const nodeConfig1 = { type: "external" as const, uri: "https://rpc-a.example", retries: 0 };
    const first = await withApi(currency, api => Promise.resolve(api), nodeConfig1);

    const nodeConfig2 = { ...nodeConfig1, uri: "https://rpc-b.example" };
    const second = await withApi(currency, api => Promise.resolve(api), nodeConfig2);

    expect(first).not.toBe(second);
    expect(first).toBeInstanceOf(JsonRpcProvider);
    expect(second).toBeInstanceOf(JsonRpcProvider);
  });

  it("provider cache should use distinct JsonRpcProviders for different currency ids", async () => {
    const nodeConfig = {
      type: "external" as const,
      uri: "https://shared-rpc.example",
      retries: 0,
    };
    const c1 = {
      id: "provider_cache_currency_one" as CryptoCurrencyId,
    } as CryptoCurrency;
    const c2 = {
      id: "provider_cache_currency_two" as CryptoCurrencyId,
    } as CryptoCurrency;
    const p1 = await withApi(c1, api => Promise.resolve(api), nodeConfig);
    const p2 = await withApi(c2, api => Promise.resolve(api), nodeConfig);

    expect(p1).not.toBe(p2);
    expect(p1).toBeInstanceOf(JsonRpcProvider);
    expect(p2).toBeInstanceOf(JsonRpcProvider);
  });

  it("should set FetchRequest maxAttempts to 1 when retries is 0", async () => {
    const currency = {
      id: "provider_fetch_throttle_test" as CryptoCurrencyId,
    } as CryptoCurrency;
    const nodeConfig = {
      type: "external" as const,
      uri: "https://rpc-throttle-test.example",
      retries: 0,
    };

    const setThrottleParamsSpy = jest.spyOn(FetchRequest.prototype, "setThrottleParams");

    await withApi(currency, api => Promise.resolve(api), nodeConfig);

    expect(setThrottleParamsSpy).toHaveBeenCalledWith({ maxAttempts: 1 });
  });
});
