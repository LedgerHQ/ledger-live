import { evmRegistration } from "./evm";
import { address, EVM_ADDRESS, EVM_PATH } from "./fixtures";

describe("evmRegistration", () => {
  it("registers an EVM account by its hexadecimal address", () => {
    expect(evmRegistration.register(address("ethereum", EVM_ADDRESS, EVM_PATH))).toEqual({
      type: "evm",
      address: EVM_ADDRESS,
    });
  });

  it("registers Ethereum Classic, whose coin type is 61", () => {
    expect(
      evmRegistration.register(address("ethereum_classic", EVM_ADDRESS, "m/44h/61h/0h/0/0")),
    ).toEqual({ type: "evm", address: EVM_ADDRESS });
  });

  it("skips a non-hexadecimal address on the EVM coin type", () => {
    expect(evmRegistration.register(address("tron", "Tabc", EVM_PATH))).toBeUndefined();
  });
});
