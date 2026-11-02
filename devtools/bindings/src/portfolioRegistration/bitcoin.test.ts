import { bitcoinRegistration } from "./bitcoin";
import { utxo, XPUB } from "./fixtures";

describe("bitcoinRegistration", () => {
  it("registers a Bitcoin account by its xpub and the full path", () => {
    expect(bitcoinRegistration.register(utxo(XPUB))).toEqual({
      type: "auto_derive",
      network: "bitcoin",
      xpub: XPUB,
      derivationPath: "m/84h/0h/0h/0/0",
    });
  });

  it("skips an xpub the service would reject", () => {
    expect(bitcoinRegistration.register(utxo("short"))).toBeUndefined();
  });
});
