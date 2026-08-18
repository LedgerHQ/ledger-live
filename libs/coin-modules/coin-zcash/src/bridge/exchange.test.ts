import { bip32asBuffer } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "./exchange";

const PATH = "44'/133'/0'/0/0";

const account = (derivationMode = "") =>
  ({ freshAddressPath: PATH, derivationMode }) as unknown as Account;

describe("getSerializedAddressParameters", () => {
  it("prefixes the derivation path with the address format the exchange app expects", () => {
    expect(getSerializedAddressParameters(account())).toEqual(
      Buffer.concat([Buffer.from([0]), bip32asBuffer(PATH)]),
    );
  });

  it.each([
    ["legacy", 0],
    ["p2sh", 1],
    ["bech32", 2],
    ["bech32m", 4],
  ])("encodes an explicitly requested %s address as %i", (addressFormat, code) => {
    expect(getSerializedAddressParameters(account(), addressFormat)[0]).toBe(code);
  });

  // Zcash accounts are legacy-derived, but the fallback reads the account
  // rather than assuming: an unknown format must not silently mean legacy.
  it.each([
    ["", 0],
    ["native_segwit", 2],
  ])("falls back to the derivation mode %p of the account, encoded as %i", (mode, code) => {
    expect(getSerializedAddressParameters(account(mode), "something-else")[0]).toBe(code);
  });
});
