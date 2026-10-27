import { registrationKey, registrationOf } from "./strategies";
import { address, EVM_ADDRESS, EVM_PATH, utxo, XPUB } from "./fixtures";

describe("registrationOf", () => {
  it("registers EVM accounts only", () => {
    expect(registrationOf(address("ethereum", EVM_ADDRESS, EVM_PATH))).toMatchObject({
      type: "evm",
    });
    expect(registrationOf(utxo(XPUB))).toBeUndefined();
    expect(registrationOf(address("solana", "9xyz", "m/44h/501h/0h/0h"))).toBeUndefined();
  });
});

describe("registrationKey", () => {
  it("matches a registration with the service's entry whatever the address case", () => {
    expect(registrationKey({ type: "evm", address: EVM_ADDRESS.toUpperCase() })).toBe(
      registrationKey({ id: "r", type: "evm", address: EVM_ADDRESS }),
    );
  });
});
