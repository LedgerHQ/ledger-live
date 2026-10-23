import { registrationOf, type PortfolioRegistrationStrategy } from ".";
import { address, EVM_ADDRESS, EVM_PATH, utxo, XPUB } from "./fixtures";

describe("registrationOf", () => {
  it("covers Bitcoin and EVM accounts", () => {
    expect(registrationOf(utxo(XPUB))).toMatchObject({ type: "auto_derive" });
    expect(registrationOf(address("ethereum", EVM_ADDRESS, EVM_PATH))).toMatchObject({
      type: "evm",
    });
  });

  it("gives nothing for Solana, which the service does not implement yet", () => {
    expect(registrationOf(address("solana", "9xyz", "m/44h/501h/0h/0h"))).toBeUndefined();
  });

  it("uses the first strategy that covers the account, and any strategy it is given", () => {
    const first: PortfolioRegistrationStrategy = {
      register: () => ({ type: "solana", address: "a" }),
    };
    const second: PortfolioRegistrationStrategy = {
      register: () => ({ type: "solana", address: "b" }),
    };
    const none: PortfolioRegistrationStrategy = { register: () => undefined };

    expect(registrationOf(utxo(XPUB), [none, first, second])).toEqual({
      type: "solana",
      address: "a",
    });
    expect(registrationOf(utxo(XPUB), [none])).toBeUndefined();
  });
});
