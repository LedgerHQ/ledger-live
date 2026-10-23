import { bitcoinRegistration } from "./bitcoin";
import { address, EVM_ADDRESS, EVM_PATH, utxo, XPUB } from "./fixtures";

describe("bitcoinRegistration", () => {
  it("registers a Bitcoin account by its xpub, with the type and the full path the service requires", () => {
    expect(bitcoinRegistration.register(utxo(XPUB))).toEqual({
      type: "auto_derive",
      network: "bitcoin",
      xpub: XPUB,
      derivationPath: "m/84h/0h/0h/0/0",
    });
  });

  it("does not cover an xpub the service would reject", () => {
    expect(bitcoinRegistration.register(utxo("short"))).toBeUndefined();
  });

  it("does not cover another UTXO family", () => {
    expect(bitcoinRegistration.register(utxo(XPUB, "litecoin"))).toBeUndefined();
  });

  it("does not cover an address account", () => {
    expect(
      bitcoinRegistration.register(address("ethereum", EVM_ADDRESS, EVM_PATH)),
    ).toBeUndefined();
  });
});
