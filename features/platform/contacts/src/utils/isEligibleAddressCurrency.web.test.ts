import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { isEligibleAddressCurrency } from "./isEligibleAddressCurrency";

const ETHEREUM = getCryptoCurrencyById("ethereum");
const BITCOIN = getCryptoCurrencyById("bitcoin");
const SEI = getCryptoCurrencyById("sei_evm");
const EVM_CONFIG = {
  status: { type: "active" as const },
  name: "Ethereum",
  unit: { name: "ether", code: "ETH", magnitude: 18 },
  chainId: 1,
};

describe("isEligibleAddressCurrency", () => {
  it("accepts a network of an eligible family the device can register", () => {
    expect(isEligibleAddressCurrency(["evm"], ETHEREUM, [], EVM_CONFIG)).toBe(true);
  });

  it("rejects a network outside the eligible families", () => {
    expect(isEligibleAddressCurrency(["evm"], BITCOIN, [], EVM_CONFIG)).toBe(false);
  });

  it("accepts an EVM network shipping its own coin app, which still registers through Ethereum", () => {
    expect(isEligibleAddressCurrency(["evm"], SEI, [], EVM_CONFIG)).toBe(true);
    expect(
      isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("ethereum_classic"), [], EVM_CONFIG),
    ).toBe(true);
  });

  it("rejects an EVM network WHEN its config carries no chain ID", () => {
    const config = {
      status: { type: "active" as const },
      name: "Ethereum",
      unit: { name: "ether", code: "ETH", magnitude: 18 },
    };
    expect(
      isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("ethereum_classic"), [], config),
    ).toBe(false);
  });

  it("accepts an EVM network WHEN its config carries a chain ID", () => {
    const config = {
      status: { type: "active" as const },
      name: "Ethereum",
      unit: { name: "ether", code: "ETH", magnitude: 18 },
      chainId: 99,
    };
    expect(
      isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("ethereum_classic"), [], config),
    ).toBe(true);
  });

  it("rejects an EVM network WHEN no config is given at all", () => {
    expect(isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("ethereum_classic"))).toBe(
      false,
    );
  });

  it("resolves a token through its parent network", () => {
    expect(
      isEligibleAddressCurrency(
        ["evm"],
        mockTokenCurrency({ parentCurrencyId: ETHEREUM.id }),
        [],
        EVM_CONFIG,
      ),
    ).toBe(true);
    expect(
      isEligibleAddressCurrency(["tron"], mockTokenCurrency({ parentCurrencyId: SEI.id })),
    ).toBe(false);
  });

  it("rejects a missing currency or an empty family list", () => {
    expect(isEligibleAddressCurrency(["evm"], null)).toBe(false);
    expect(isEligibleAddressCurrency(["evm"], undefined)).toBe(false);
    expect(isEligibleAddressCurrency([], ETHEREUM, [], EVM_CONFIG)).toBe(false);
  });

  it("rejects an explicitly excluded network", () => {
    expect(isEligibleAddressCurrency(["evm"], ETHEREUM, ["ethereum"], EVM_CONFIG)).toBe(false);
    expect(isEligibleAddressCurrency(["evm"], SEI, ["sei_evm"], EVM_CONFIG)).toBe(false);
  });

  it("still accepts non-excluded networks when an exclusion list is present", () => {
    expect(isEligibleAddressCurrency(["evm"], ETHEREUM, ["sei_evm"], EVM_CONFIG)).toBe(true);
  });

  it("rejects a token whose parent network is excluded", () => {
    expect(
      isEligibleAddressCurrency(
        ["evm"],
        mockTokenCurrency({ parentCurrencyId: ETHEREUM.id }),
        ["ethereum"],
        EVM_CONFIG,
      ),
    ).toBe(false);
  });
});
