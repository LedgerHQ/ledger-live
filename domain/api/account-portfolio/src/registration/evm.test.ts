import { evmRegistration } from "./evm";
import { mockAddressDescriptor, MOCK_EVM_ADDRESS, MOCK_EVM_PATH } from "../portfolioApi.mock";

describe("evmRegistration", () => {
  it("registers an EVM account by its hexadecimal address", () => {
    expect(
      evmRegistration.register(mockAddressDescriptor("ethereum", MOCK_EVM_ADDRESS, MOCK_EVM_PATH)),
    ).toEqual({
      type: "evm",
      address: MOCK_EVM_ADDRESS,
    });
  });

  it("registers Ethereum Classic, whose coin type is 61", () => {
    expect(
      evmRegistration.register(
        mockAddressDescriptor("ethereum_classic", MOCK_EVM_ADDRESS, "m/44h/61h/0h/0/0"),
      ),
    ).toEqual({ type: "evm", address: MOCK_EVM_ADDRESS });
  });

  it("skips a non-hexadecimal address on the EVM coin type", () => {
    expect(
      evmRegistration.register(mockAddressDescriptor("tron", "Tabc", MOCK_EVM_PATH)),
    ).toBeUndefined();
  });
});
