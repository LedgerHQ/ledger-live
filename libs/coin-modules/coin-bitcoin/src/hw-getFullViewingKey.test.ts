import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ChainAdapter } from "./chain-adapters/types";
import { getChainAdapter } from "./chain-adapters/registry";
import type { BitcoinSigner, SignerContext } from "./signer";
import resolver from "./hw-getFullViewingKey";

jest.mock("./chain-adapters/registry", () => ({
  getChainAdapter: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

const mockedGetChainAdapter = jest.mocked(getChainAdapter);

// A SignerContext stub: hw-getFullViewingKey only forwards it to the adapter,
// it never invokes it itself. The reference identity is what matters.
const signerContext: SignerContext = <T>(
  _deviceId: string,
  _crypto: CryptoCurrency,
  _fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> => Promise.reject(new Error("signerContext should not be called directly"));

const currency = getCryptoCurrencyById("zcash");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("hw-getFullViewingKey resolver", () => {
  it("returns the viewKey + path returned by the chain adapter", async () => {
    const adapter: ChainAdapter = {
      id: currency.id,
      getFullViewingKey: jest.fn().mockResolvedValue("uview1key"),
    };
    mockedGetChainAdapter.mockReturnValue(adapter);

    const result = await resolver(signerContext)("device-id", {
      currency,
      path: "44'/133'/0'",
    });

    expect(mockedGetChainAdapter).toHaveBeenCalledWith(currency.id);
    expect(result).toEqual({ viewKey: "uview1key", path: "44'/133'/0'" });
  });

  it("forwards deviceId, currency, path and signerContext to the adapter", async () => {
    const adapterFn = jest.fn().mockResolvedValue("uview1key");
    mockedGetChainAdapter.mockReturnValue({
      id: currency.id,
      getFullViewingKey: adapterFn,
    });

    await resolver(signerContext)("device-id", {
      currency,
      path: "44'/133'/0'",
    });

    expect(adapterFn).toHaveBeenCalledTimes(1);
    expect(adapterFn).toHaveBeenCalledWith("device-id", currency, "44'/133'/0'", signerContext);
  });

  it("throws a descriptive error when the chain adapter does not implement getFullViewingKey", async () => {
    // Default adapter shape: only `id`, no optional methods (matches what
    // `getChainAdapter("bitcoin")` returns at runtime).
    mockedGetChainAdapter.mockReturnValue({ id: "bitcoin" });

    const bitcoin = getCryptoCurrencyById("bitcoin");

    await expect(
      resolver(signerContext)("device-id", { currency: bitcoin, path: "44'/0'/0'" }),
    ).rejects.toThrow("bitcoin does not support full viewing key export");
  });

  it("throws when the adapter's getFullViewingKey synchronously returns undefined", async () => {
    // The resolver short-circuits on the `?.` result, not on resolution: an
    // adapter that opts out by returning `undefined` should be rejected the
    // same way as one that doesn't define the method at all.
    mockedGetChainAdapter.mockReturnValue({
      id: currency.id,
      getFullViewingKey: jest.fn().mockReturnValue(undefined),
    });

    await expect(
      resolver(signerContext)("device-id", { currency, path: "44'/133'/0'" }),
    ).rejects.toThrow("zcash does not support full viewing key export");
  });

  it("propagates errors thrown by the chain adapter", async () => {
    mockedGetChainAdapter.mockReturnValue({
      id: currency.id,
      getFullViewingKey: jest.fn().mockRejectedValue(new Error("device locked")),
    });

    await expect(
      resolver(signerContext)("device-id", { currency, path: "44'/133'/0'" }),
    ).rejects.toThrow("device locked");
  });

  it("returns the path verbatim (does not normalize hardened markers or leading slashes)", async () => {
    mockedGetChainAdapter.mockReturnValue({
      id: currency.id,
      getFullViewingKey: jest.fn().mockResolvedValue("uview1key"),
    });

    const result = await resolver(signerContext)("device-id", {
      currency,
      path: "m/44'/133'/0'",
    });

    expect(result.path).toBe("m/44'/133'/0'");
  });
});
