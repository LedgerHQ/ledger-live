import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { isEligibleAddressCurrency } from "./isEligibleAddressCurrency";

const ETHEREUM = getCryptoCurrencyById("ethereum");
const BITCOIN = getCryptoCurrencyById("bitcoin");
const SEI = getCryptoCurrencyById("sei_evm");

describe("isEligibleAddressCurrency", () => {
  it("accepts a network of an eligible family the device can register", () => {
    expect(isEligibleAddressCurrency(["evm"], ETHEREUM)).toBe(true);
  });

  it("rejects a network outside the eligible families", () => {
    expect(isEligibleAddressCurrency(["evm"], BITCOIN)).toBe(false);
  });

  it("accepts an EVM network shipping its own coin app, which still registers through Ethereum", () => {
    expect(isEligibleAddressCurrency(["evm"], SEI)).toBe(true);
    expect(isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("ethereum_classic"))).toBe(
      true,
    );
  });

  it("rejects an EVM network without an EIP-155 chain ID", () => {
    expect(isEligibleAddressCurrency(["evm"], getCryptoCurrencyById("poa"))).toBe(false);
  });

  it("resolves a token through its parent network", () => {
    expect(
      isEligibleAddressCurrency(["evm"], mockTokenCurrency({ parentCurrencyId: ETHEREUM.id })),
    ).toBe(true);
    expect(
      isEligibleAddressCurrency(["tron"], mockTokenCurrency({ parentCurrencyId: SEI.id })),
    ).toBe(false);
  });

  it("rejects a missing currency or an empty family list", () => {
    expect(isEligibleAddressCurrency(["evm"], null)).toBe(false);
    expect(isEligibleAddressCurrency(["evm"], undefined)).toBe(false);
    expect(isEligibleAddressCurrency([], ETHEREUM)).toBe(false);
  });
});
