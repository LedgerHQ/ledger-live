import { registrationOf } from ".";
import { address, utxo, XPUB } from "./fixtures";

describe("registrationOf", () => {
  it("registers Bitcoin and skips a chain with no strategy", () => {
    expect(registrationOf(utxo(XPUB))).toMatchObject({ type: "auto_derive" });
    expect(registrationOf(address("solana", "9xyz", "m/44h/501h/0h/0h"))).toBeUndefined();
  });
});
