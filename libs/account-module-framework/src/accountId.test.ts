import { accountDerivationPath, accountIdOf } from "./accountId";

describe("accountIdOf", () => {
  it("keys an account like Ledger Wallet does", () => {
    expect(
      accountIdOf({ currencyId: "bitcoin", key: "xpub", derivationMode: "native_segwit" }),
    ).toBe("js:2:bitcoin:xpub:native_segwit");
  });
});

describe("accountDerivationPath", () => {
  it("puts the account index under the purpose and coin type of the scheme", () => {
    expect(accountDerivationPath("84'/0'", 3)).toBe("84'/0'/3'");
    expect(accountDerivationPath("84'/0'/0'/0/0", 1)).toBe("84'/0'/1'");
  });

  it("rejects a scheme without coin type", () => {
    expect(() => accountDerivationPath("84'", 0)).toThrow("Invalid derivation scheme 84'");
  });
});
