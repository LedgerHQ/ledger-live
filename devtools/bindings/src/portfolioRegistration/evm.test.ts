import { evmRegistration } from "./evm";
import { address, EVM_ADDRESS, EVM_PATH, utxo, XPUB } from "./fixtures";

describe("evmRegistration", () => {
  it("registers an EVM account by its hexadecimal address", () => {
    expect(evmRegistration.register(address("ethereum", EVM_ADDRESS, EVM_PATH))).toEqual({
      type: "evm",
      address: EVM_ADDRESS,
    });
  });

  it("does not cover a non-hexadecimal address, even on the EVM coin type", () => {
    expect(evmRegistration.register(address("tron", "Tabc", EVM_PATH))).toBeUndefined();
  });

  it("does not cover an EVM address outside the EVM coin type", () => {
    expect(
      evmRegistration.register(address("ethereum", EVM_ADDRESS, "m/44h/501h/0h/0h")),
    ).toBeUndefined();
  });

  it("does not cover a network the service does not know", () => {
    expect(evmRegistration.register(address("injective", EVM_ADDRESS, EVM_PATH))).toBeUndefined();
  });

  it("does not cover a UTXO account", () => {
    expect(evmRegistration.register(utxo(XPUB))).toBeUndefined();
  });
});
