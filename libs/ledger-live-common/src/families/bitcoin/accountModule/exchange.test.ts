import type { Account } from "@ledgerhq/types-live";
import { bip32asBuffer } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getSerializedAddressParameters } from "./exchange";

const account = (derivationMode: string) =>
  ({ derivationMode, freshAddressPath: "84'/0'/0'/0/3" }) as unknown as Account;

describe("getSerializedAddressParameters", () => {
  it("prefixes the fresh address path with the account's address format", () => {
    expect(getSerializedAddressParameters(account("native_segwit"))).toEqual(
      Buffer.concat([Buffer.from([2]), bip32asBuffer("84'/0'/0'/0/3")]),
    );
    expect(getSerializedAddressParameters(account("taproot"))[0]).toBe(4);
    expect(getSerializedAddressParameters(account("segwit"))[0]).toBe(1);
    expect(getSerializedAddressParameters(account(""))[0]).toBe(0);
  });

  it("takes the requested format when it knows it", () => {
    expect(getSerializedAddressParameters(account(""), "bitcoin_cash")[0]).toBe(3);
    expect(getSerializedAddressParameters(account("native_segwit"), "nope")[0]).toBe(2);
  });

  it("refuses a format it does not know", () => {
    expect(() => getSerializedAddressParameters(account("cashaddr"))).toThrow(
      "unsupported format cashaddr",
    );
  });
});
