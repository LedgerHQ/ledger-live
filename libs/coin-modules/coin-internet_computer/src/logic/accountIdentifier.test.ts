import { Principal } from "@icp-sdk/core/principal";
import { AccountIdentifier, SubAccount } from "./accountIdentifier";

const GOVERNANCE = "rrkah-fqaaa-aaaaa-aaaaq-cai";
const SUBACCOUNT_0_TO_31 = Uint8Array.from({ length: 32 }, (_, i) => i);

// Expected values computed with @dfinity/ledger-icp's AccountIdentifier.
describe("AccountIdentifier.fromPrincipal", () => {
  it.each([
    ["2vxsx-fae", "1c7a48ba6a562aa9eaa2481a9049cdf0433b9738c992d698c31d8abf89cadc79"],
    [GOVERNANCE, "082ecf2e3f647ac600f43f38a68342fba5b8e68b085f02592b77f39808a8d2b5"],
    [
      "qmja6-ma7bq-kxeep-f3lpi-bmu4n-aefcl-xpc5o-iqbsi-5wi5u-b37vi-wae",
      "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417",
    ],
  ])("derives %s's default account", (principal, expected) => {
    expect(
      AccountIdentifier.fromPrincipal({ principal: Principal.fromText(principal) }).toHex(),
    ).toBe(expected);
  });

  it("derives a subaccount", () => {
    const subAccount = SubAccount.fromBytes(SUBACCOUNT_0_TO_31);
    if (subAccount instanceof Error) throw subAccount;
    const id = AccountIdentifier.fromPrincipal({
      principal: Principal.fromText(GOVERNANCE),
      subAccount,
    });
    expect(id.toHex()).toBe("0d6a5b1551a94106e5e789f91235e66341b503b63841ff4a66091d83b6de098f");
  });

  it("returns the 32 bytes the ledger takes as `to`", () => {
    const id = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(GOVERNANCE) });
    expect(id.toUint8Array()).toHaveLength(32);
    expect(Buffer.from(id.toUint8Array()).toString("hex")).toBe(id.toHex());
  });
});

describe("AccountIdentifier.fromHex", () => {
  it("round-trips a hex account identifier", () => {
    const hex = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";
    expect(AccountIdentifier.fromHex(hex).toHex()).toBe(hex);
  });

  it("stops at the first non-hex character without throwing", () => {
    expect(AccountIdentifier.fromHex("ab12zz").toHex()).toBe("ab12");
    expect(AccountIdentifier.fromHex("zz").toHex()).toBe("");
  });
});

describe("SubAccount.fromBytes", () => {
  it("rejects anything but 32 bytes", () => {
    expect(SubAccount.fromBytes(new Uint8Array(31))).toEqual(
      new Error("Subaccount length must be 32-bytes"),
    );
  });

  it("keeps the bytes it was given", () => {
    const subAccount = SubAccount.fromBytes(SUBACCOUNT_0_TO_31);
    expect(subAccount).toBeInstanceOf(SubAccount);
    expect((subAccount as SubAccount).toUint8Array()).toEqual(SUBACCOUNT_0_TO_31);
  });
});
