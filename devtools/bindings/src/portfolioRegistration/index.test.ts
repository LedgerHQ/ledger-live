import { registrationOf } from ".";
import { address, EVM_ADDRESS, EVM_PATH, utxo, XPUB } from "./fixtures";

describe("registrationOf", () => {
  it("registers Bitcoin and skips a chain with no strategy", () => {
    expect(registrationOf(utxo(XPUB))).toMatchObject({ type: "auto_derive" });
    expect(registrationOf(address("solana", "9xyz", "m/44h/501h/0h/0h"))).toBeUndefined();
  });

  it("never registers a mock account, next to real ones", () => {
    const real = [utxo(XPUB), address("ethereum", EVM_ADDRESS, EVM_PATH)];
    const mocks = real.map(descriptor => ({ ...descriptor, purpose: "mock" as const }));
    expect([...real, ...mocks].map(descriptor => registrationOf(descriptor) !== undefined)).toEqual(
      [true, true, false, false],
    );
  });
});
