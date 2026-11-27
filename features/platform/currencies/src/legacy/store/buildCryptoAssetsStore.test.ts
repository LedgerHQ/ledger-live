import type { CryptoAssetsApi } from "@domain/api-currency-token";
import {
  buildCryptoAssetsStore,
  remapRtkQueryError,
  type CryptoAssetsStoreDispatch,
} from "./buildCryptoAssetsStore";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "../../errors";

function setup() {
  const initiate = {
    findTokenById: jest.fn((arg: unknown) => ({ thunk: "findTokenById", arg })),
    findTokenByAddressInCurrency: jest.fn((arg: unknown) => ({
      thunk: "findTokenByAddressInCurrency",
      arg,
    })),
    getTokensSyncHash: jest.fn((arg: unknown) => ({ thunk: "getTokensSyncHash", arg })),
    getTokenListHash: jest.fn((arg: unknown) => ({ thunk: "getTokenListHash", arg })),
  };
  const api = {
    endpoints: {
      findTokenById: { initiate: initiate.findTokenById },
      findTokenByAddressInCurrency: { initiate: initiate.findTokenByAddressInCurrency },
      getTokensSyncHash: { initiate: initiate.getTokensSyncHash },
      getTokenListHash: { initiate: initiate.getTokenListHash },
    },
  } as unknown as CryptoAssetsApi;
  const dispatch = jest.fn();
  const store = buildCryptoAssetsStore({
    dispatch: dispatch as unknown as CryptoAssetsStoreDispatch,
    api,
  });
  return { store, dispatch, initiate };
}

describe("buildCryptoAssetsStore", () => {
  describe("dispatches the matching endpoint", () => {
    it("findTokenById initiates with { id } and returns the data", async () => {
      const { store, dispatch, initiate } = setup();
      dispatch.mockResolvedValue({ data: { id: "ethereum/erc20/usdc" } });

      const result = await store.findTokenById("ethereum/erc20/usdc");

      expect(initiate.findTokenById).toHaveBeenCalledWith({ id: "ethereum/erc20/usdc" });
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: "ethereum/erc20/usdc" });
    });

    it("findTokenByAddressInCurrency includes token_identifier only when provided", async () => {
      const { store, dispatch, initiate } = setup();
      dispatch.mockResolvedValue({ data: undefined });

      await store.findTokenByAddressInCurrency("EGLD-123", "elrond", "MYTOKEN-abc");
      expect(initiate.findTokenByAddressInCurrency).toHaveBeenCalledWith({
        contract_address: "EGLD-123",
        network: "elrond",
        token_identifier: "MYTOKEN-abc",
      });

      await store.findTokenByAddressInCurrency("0xABC", "ethereum");
      expect(initiate.findTokenByAddressInCurrency).toHaveBeenLastCalledWith({
        contract_address: "0xABC",
        network: "ethereum",
      });
    });

    it("getTokensSyncHash returns the token list hash and still queries the commit", async () => {
      const { store, dispatch, initiate } = setup();
      dispatch.mockImplementation(async (action: { thunk: string }) => ({
        data: action.thunk === "getTokenListHash" ? "list-hash" : "commit",
      }));

      const result = await store.getTokensSyncHash("ethereum");

      expect(initiate.getTokenListHash).toHaveBeenCalledWith("ethereum");
      expect(initiate.getTokensSyncHash).toHaveBeenCalledWith("ethereum");
      expect(result).toBe("list-hash");
    });

    it("getTokensSyncHash ignores a failed commit query", async () => {
      const { store, dispatch } = setup();
      dispatch.mockImplementation(async (action: { thunk: string }) =>
        action.thunk === "getTokenListHash"
          ? { data: "list-hash" }
          : { error: { status: 500, data: "boom" } },
      );

      await expect(store.getTokensSyncHash("ethereum")).resolves.toBe("list-hash");
    });

    it("returns undefined when the token is not found", async () => {
      const { store, dispatch } = setup();
      dispatch.mockResolvedValue({ data: undefined });
      await expect(store.findTokenById("nope")).resolves.toBeUndefined();
    });
  });

  describe("remaps RTK-Query errors", () => {
    it.each([
      [400, LedgerAPI4xx],
      [404, LedgerAPI4xx],
      [499, LedgerAPI4xx],
      [500, LedgerAPI5xx],
      [503, LedgerAPI5xx],
      [599, LedgerAPI5xx],
      [200, NetworkDown],
      [301, NetworkDown],
      [600, NetworkDown],
      [0, NetworkDown],
    ])("status %i -> %p", async (status, ErrorClass) => {
      const { store, dispatch } = setup();
      dispatch.mockResolvedValue({ error: { status, error: "x" } });
      await expect(store.findTokenById("id")).rejects.toBeInstanceOf(ErrorClass);
    });

    it("FETCH_ERROR -> NetworkDown", async () => {
      const { store, dispatch } = setup();
      dispatch.mockResolvedValue({ error: { status: "FETCH_ERROR", error: "Failed to fetch" } });
      await expect(store.getTokensSyncHash("ethereum")).rejects.toBeInstanceOf(NetworkDown);
    });

    it("other string status -> generic Error carrying the message", async () => {
      const { store, dispatch } = setup();
      dispatch.mockResolvedValue({ error: { status: "PARSING_ERROR", error: "bad json" } });
      await expect(store.findTokenById("id")).rejects.toThrow("bad json");
    });
  });

  it("PARSING_ERROR with a raw Zod-issue-array payload -> readable fallback message", async () => {
    const { store, dispatch } = setup();
    dispatch.mockResolvedValue({
      error: {
        status: "PARSING_ERROR",
        error: [
          {
            code: "invalid_type",
            expected: "array",
            received: "null",
            path: [],
            message: "Invalid input: expected array, received null",
          },
        ],
      },
    });
    await expect(store.findTokenById("id")).rejects.toThrow("Unknown parsing_error error");
  });

  it("defaults to the shared cryptoAssetsApi when no api is injected", () => {
    expect(() =>
      buildCryptoAssetsStore({ dispatch: jest.fn() as unknown as CryptoAssetsStoreDispatch }),
    ).not.toThrow();
  });
});

describe("remapRtkQueryError", () => {
  it("maps a SerializedError (no status) to a generic Error with its message", () => {
    const err = remapRtkQueryError({ name: "Error", message: "boom" });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("boom");
  });

  it.each([
    [{ status: 403, data: {} }, LedgerAPI4xx, 403],
    [{ status: 404, data: "Currency not found: x" }, LedgerAPI4xx, 404],
    [{ status: 503, data: {} }, LedgerAPI5xx, 503],
    [
      { status: "PARSING_ERROR", originalStatus: 403, data: "Forbidden", error: "SyntaxError" },
      LedgerAPI4xx,
      403,
    ],
    [
      { status: "PARSING_ERROR", originalStatus: 502, data: "<html>", error: "SyntaxError" },
      LedgerAPI5xx,
      502,
    ],
  ] as const)("keeps the HTTP status of %p", (error, ErrorClass, status) => {
    const err = remapRtkQueryError(error);
    expect(err).toBeInstanceOf(ErrorClass);
    expect(err).toMatchObject({ status });
  });

  it.each([
    [{ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }, NetworkDown],
    [{ status: 302, data: {} }, NetworkDown],
  ] as const)("maps %p to NetworkDown", (error, ErrorClass) => {
    expect(remapRtkQueryError(error)).toBeInstanceOf(ErrorClass);
  });

  it("surfaces the message of a 2xx body that is not JSON", () => {
    const err = remapRtkQueryError({
      status: "PARSING_ERROR",
      originalStatus: 200,
      data: "x",
      error: "X-Ledger-Commit header not found in response",
    });
    expect(err.constructor).toBe(Error);
    expect(err.message).toBe("X-Ledger-Commit header not found in response");
  });
});
