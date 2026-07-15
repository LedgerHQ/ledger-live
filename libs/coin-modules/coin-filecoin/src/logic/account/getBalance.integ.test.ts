import { generateMnemonic, accountFromMnemonic } from "iso-filecoin/wallet";
import { TEST_ADDRESSES } from "../../test/fixtures";
import { getBalance } from "./getBalance";

describe("getBalance (integration)", () => {
  it("returns native balance > 0 for a funded account", async () => {
    const balances = await getBalance(TEST_ADDRESSES.F1_ADDRESS);

    expect(balances.length).toBeGreaterThanOrEqual(1);

    const native = balances[0];
    expect(native.asset).toEqual({ type: "native" });
    expect(typeof native.value).toBe("bigint");
    expect(native.value).toBeGreaterThan(0n);
    expect(typeof native.locked).toBe("bigint");
    expect(native.locked).toBeGreaterThanOrEqual(0n);
  });

  it("returns native balance = 0 for a pristine account", async () => {
    // Generate a fresh address that has never received funds
    const mnemonic = generateMnemonic();
    const pristine = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");

    const balances = await getBalance(pristine.address.toString());

    expect(balances.length).toBeGreaterThanOrEqual(1);
    const native = balances[0];
    expect(native.asset).toEqual({ type: "native" });
    expect(native.value).toBe(0n);
  });
});
