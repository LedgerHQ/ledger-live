import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { DerivationMode } from "@ledgerhq/types-live";
import { TEST_LOGGER } from "./__tests__/fixtures/coinConfig";
import { mockSigner } from "./fixtures/common.fixtures";
import resolver from "./hw-getAddress";
import type { AddressFormat, BitcoinAddress, SignerContext } from "./signer";

const PATH = "84'/0'/0'/0/0";
const ADDRESS = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
const PUBLIC_KEY = "04c621f37493d99f39ca12fb02ba7fe1687b1650b875dcb6733f386a98958e65";
const CHAIN_CODE = "a45d311c31a80bf06cc38d8ed7934bd1e8a7b2d48b2868a70258a86e094bacfb";

const bitcoin = getCryptoCurrencyById("bitcoin");

type SignerCall = [string, { verify?: boolean; format?: AddressFormat } | undefined];

const signerReturning = (
  result: () => Promise<BitcoinAddress>,
): { signerContext: SignerContext; calls: SignerCall[] } => {
  const calls: SignerCall[] = [];
  const signerContext: SignerContext = (_deviceId, _currency, fn) =>
    fn({
      ...mockSigner,
      getWalletPublicKey: (path, opts) => {
        calls.push([path, opts]);
        return result();
      },
    });
  return { signerContext, calls };
};

const derivedAddress = (): Promise<BitcoinAddress> =>
  Promise.resolve({ bitcoinAddress: ADDRESS, publicKey: PUBLIC_KEY, chainCode: CHAIN_CODE });

describe("bitcoin address resolver", () => {
  it("returns the address, the path, the public key and the chain code of the signer", async () => {
    const { signerContext } = signerReturning(derivedAddress);

    const result = await resolver(signerContext, TEST_LOGGER)("device", {
      currency: bitcoin,
      path: PATH,
      derivationMode: "native_segwit",
    });

    expect(result).toEqual({
      address: ADDRESS,
      path: PATH,
      publicKey: PUBLIC_KEY,
      chainCode: CHAIN_CODE,
    });
  });

  it("omits the chain code when the signer returns none", async () => {
    const { signerContext } = signerReturning(() =>
      Promise.resolve({ bitcoinAddress: ADDRESS, publicKey: PUBLIC_KEY, chainCode: "" }),
    );

    const result = await resolver(signerContext, TEST_LOGGER)("device", {
      currency: bitcoin,
      path: PATH,
      derivationMode: "native_segwit",
    });

    expect(result).toEqual({ address: ADDRESS, path: PATH, publicKey: PUBLIC_KEY });
  });

  it.each<[DerivationMode, AddressFormat]>([
    ["", "legacy"],
    ["segwit", "p2sh"],
    ["native_segwit", "bech32"],
    ["taproot", "bech32m"],
  ])(
    "asks the signer for the %j derivation mode on the given path in the %s format",
    async (derivationMode, format) => {
      const { signerContext, calls } = signerReturning(derivedAddress);

      await resolver(signerContext, TEST_LOGGER)("device", {
        currency: bitcoin,
        path: PATH,
        derivationMode,
      });

      expect(calls).toEqual([[PATH, { verify: false, format }]]);
    },
  );

  it("asks the signer to verify the address on the device when requested", async () => {
    const { signerContext, calls } = signerReturning(derivedAddress);

    await resolver(signerContext, TEST_LOGGER)("device", {
      currency: bitcoin,
      path: PATH,
      derivationMode: "native_segwit",
      verify: true,
    });

    expect(calls).toEqual([[PATH, { verify: true, format: "bech32" }]]);
  });

  it("forces the requested format over the one of the derivation mode", async () => {
    const { signerContext, calls } = signerReturning(derivedAddress);

    await resolver(signerContext, TEST_LOGGER)("device", {
      currency: bitcoin,
      path: PATH,
      derivationMode: "native_segwit",
      forceFormat: "legacy",
    });

    expect(calls).toEqual([[PATH, { verify: false, format: "legacy" }]]);
  });

  it.each(["invalid format", "Unsupported address format"])(
    "reports an unsupported derivation when the signer fails with %j",
    async message => {
      const { signerContext } = signerReturning(() => Promise.reject(new Error(message)));

      await expect(
        resolver(signerContext, TEST_LOGGER)("device", {
          currency: bitcoin,
          path: PATH,
          derivationMode: "taproot",
        }),
      ).rejects.toMatchObject({ name: "UnsupportedDerivation" });
    },
  );

  it("rethrows any other signer failure", async () => {
    const failure = new Error("device locked");
    const { signerContext } = signerReturning(() => Promise.reject(failure));

    await expect(
      resolver(signerContext, TEST_LOGGER)("device", {
        currency: bitcoin,
        path: PATH,
        derivationMode: "taproot",
      }),
    ).rejects.toBe(failure);
  });
});
