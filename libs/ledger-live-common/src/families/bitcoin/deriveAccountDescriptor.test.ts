import { lastValueFrom, type Observable } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { deriveAccountDescriptor } from "./setup";

const getWalletPublicKey = jest.fn();
const getWalletXpub = jest.fn();
jest.mock("@ledgerhq/hw-app-btc", () =>
  jest.fn().mockImplementation(() => ({ getWalletPublicKey, getWalletXpub })),
);
const runOnTransport = <T>(job: (transport: never) => Observable<T>) => job({} as never);

const bitcoin = getCryptoCurrencyById("bitcoin");
const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";

beforeEach(() => jest.clearAllMocks());

describe("bitcoin deriveAccountDescriptor", () => {
  it("checks the mode's address format, then reads the xpub at the account path", async () => {
    getWalletPublicKey.mockResolvedValue({
      bitcoinAddress: "bc1q",
      publicKey: "04",
      chainCode: "",
    });
    getWalletXpub.mockResolvedValue(XPUB);
    const descriptor = await lastValueFrom(
      deriveAccountDescriptor(runOnTransport, bitcoin, candidateOf(bitcoin, "native_segwit", 1)),
    );
    expect(getWalletPublicKey).toHaveBeenCalledWith(
      "84'/0'/1'/0/0",
      expect.objectContaining({ format: "bech32" }),
    );
    expect(getWalletXpub).toHaveBeenCalledWith(expect.objectContaining({ path: "84'/0'/1'" }));
    expect(descriptor).toMatchObject({ type: "utxo", key: XPUB, path: "m/84h/0h/1h" });
  });

  it("does not derive a taproot account on an app that cannot use its addresses", async () => {
    getWalletPublicKey.mockRejectedValue(new Error("Unsupported address format bech32m"));
    await expect(
      lastValueFrom(
        deriveAccountDescriptor(runOnTransport, bitcoin, candidateOf(bitcoin, "taproot", 0)),
      ),
    ).rejects.toMatchObject({ name: "UnsupportedDerivation" });
    expect(getWalletXpub).not.toHaveBeenCalled();
  });
});
