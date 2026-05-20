/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { AssertionError } from "node:assert";
import { FetchRequest, JsonRpcProvider } from "ethers";
import { DEFAULT_RETRIES_RPC_METHODS, withApi } from "./withApi";
import * as withRetriesModule from "./withRetries";
import { makeUniqueRandomCurrency, makeUniqueRandomNodeConfig } from "../fixtures/common.fixtures";

jest.mock("./withRetries", () => {
  const originalModule = jest.requireActual("./withRetries");
  return {
    ...originalModule,
    withRetries: jest.fn().mockImplementation(originalModule.withRetries),
  };
});

const withRetriesSpy = jest.spyOn(withRetriesModule, "withRetries");

describe("withApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retry on fail", async () => {
    let retries = 2;
    const spy = jest.fn(async () => {
      if (retries) {
        --retries;
        throw new Error("Error thrown to force retry on unit test");
      }
      return true;
    });
    const response = await withApi(
      makeUniqueRandomCurrency(),
      spy,
      makeUniqueRandomNodeConfig({ retries: 2 }),
    );

    expect(response).toBe(true);
    // it should fail 2 times and succeed on the next try
    expect(spy).toHaveBeenCalledTimes(3);
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

  it("should use withRetries when retry policy is application", async () => {
    await withApi(
      makeUniqueRandomCurrency(),
      (_api: JsonRpcProvider) => Promise.resolve(),
      makeUniqueRandomNodeConfig(),
      "application",
    );

    expect(withRetriesSpy).toHaveBeenCalled();
  });

  it("should set ethers retry limit to 1 when policy is application", async () => {
    const setThrottleParamsSpy = jest.spyOn(FetchRequest.prototype, "setThrottleParams");

    await withApi(
      makeUniqueRandomCurrency(),
      (_api: JsonRpcProvider) => Promise.resolve(),
      makeUniqueRandomNodeConfig(),
      "application",
    );

    expect(setThrottleParamsSpy).toHaveBeenCalledWith({ maxAttempts: 1 });
  });

  it("should not use withRetries when retry policy is library", async () => {
    await withApi(
      makeUniqueRandomCurrency(),
      (_api: JsonRpcProvider) => Promise.resolve(),
      makeUniqueRandomNodeConfig(),
      "library",
    );

    expect(withRetriesSpy).not.toHaveBeenCalled();
  });

  it("should set ethers retry limit from node configuration when policy is library", async () => {
    const setThrottleParamsSpy = jest.spyOn(FetchRequest.prototype, "setThrottleParams");
    const expectedRetries = 5;

    await withApi(
      makeUniqueRandomCurrency(),
      (_api: JsonRpcProvider) => Promise.resolve(),
      makeUniqueRandomNodeConfig({ retries: expectedRetries }),
      "library",
    );

    expect(setThrottleParamsSpy).toHaveBeenCalledWith({ maxAttempts: expectedRetries });
  });

  it("should disable ethers built-in HTTP retries by setting maxAttempts: 1 on FetchRequest", async () => {
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
