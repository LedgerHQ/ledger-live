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

  describe("against the portfolio", () => {
    const lower = EVM_ADDRESS.toLowerCase();
    const polygon = address("polygon", EVM_ADDRESS, EVM_PATH);
    const portfolio = (networks: string[]) => ({
      id: "p",
      accounts: networks.map(network => ({
        id: `${network}:${lower}`,
        network,
        status: "synchronized" as const,
      })),
    });

    it("finds the account the fan-out made on its network", () => {
      expect(evmRegistration.accountIdsOf(polygon, portfolio(["ethereum", "polygon"]))).toEqual([
        `polygon:${lower}`,
      ]);
    });

    it("is not served once the fan-out exists without its network", () => {
      expect(evmRegistration.isNotServed(polygon, portfolio(["ethereum"]))).toBe(true);
    });

    it("is only waiting while the fan-out has not happened yet", () => {
      expect(evmRegistration.accountIdsOf(polygon, portfolio([]))).toEqual([]);
      expect(evmRegistration.isNotServed(polygon, portfolio([]))).toBe(false);
    });
  });
});
