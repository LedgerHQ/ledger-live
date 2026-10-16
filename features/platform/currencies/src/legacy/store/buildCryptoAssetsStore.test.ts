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
    findTokenByTokenIdentifierInCurrency: jest.fn((arg: unknown) => ({
      thunk: "findTokenByTokenIdentifierInCurrency",
      arg,
    })),
    getTokensSyncHash: jest.fn((arg: unknown) => ({ thunk: "getTokensSyncHash", arg })),
  };
  const api = {
    endpoints: {
      findTokenById: { initiate: initiate.findTokenById },
      findTokenByAddressInCurrency: { initiate: initiate.findTokenByAddressInCurrency },
      findTokenByTokenIdentifierInCurrency: {
        initiate: initiate.findTokenByTokenIdentifierInCurrency,
      },
      getTokensSyncHash: { initiate: initiate.getTokensSyncHash },
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

    it("findTokenByTokenIdentifierInCurrency initiates with the identifier and network", async () => {
      const { store, dispatch, initiate } = setup();
      dispatch.mockResolvedValue({ data: { id: "tron/trc10/1002000" } });

      const result = await store.findTokenByTokenIdentifierInCurrency("1002000", "tron");

      expect(initiate.findTokenByTokenIdentifierInCurrency).toHaveBeenCalledWith({
        token_identifier: "1002000",
        network: "tron",
      });
      expect(result).toEqual({ id: "tron/trc10/1002000" });
    });

    it("getTokensSyncHash initiates with the currencyId and returns the hash", async () => {
      const { store, dispatch, initiate } = setup();
      dispatch.mockResolvedValue({ data: "abc123" });

      const result = await store.getTokensSyncHash("ethereum");

      expect(initiate.getTokensSyncHash).toHaveBeenCalledWith("ethereum");
      expect(result).toBe("abc123");
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

    it("an ambiguous token_identifier lookup rejects with the endpoint's message", async () => {
      const { store, dispatch } = setup();
      dispatch.mockResolvedValue({
        error: { name: "Error", message: 'token_identifier "0" matches several tezos tokens' },
      });
      await expect(store.findTokenByTokenIdentifierInCurrency("0", "tezos")).rejects.toThrow(
        'token_identifier "0" matches several tezos tokens',
      );
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
});
