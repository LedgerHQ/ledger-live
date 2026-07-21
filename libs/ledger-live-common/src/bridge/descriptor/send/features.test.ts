import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { sendFeatures } from "./features";

const celo = getCryptoCurrencyById("celo");
const stellar = getCryptoCurrencyById("stellar");
const ethereum = getCryptoCurrencyById("ethereum");

describe("sendFeatures.hasDefaultStrategy / getDefaultStrategyPatch", () => {
  it("Celo: declares a default strategy that clears feesStrategy + fees only", () => {
    expect(sendFeatures.hasDefaultStrategy(celo)).toBe(true);

    const patch = sendFeatures.getDefaultStrategyPatch(celo);
    expect(patch).toEqual({ feesStrategy: undefined, fees: undefined });
    expect(patch).not.toHaveProperty("feeCurrency");
    expect(patch).not.toHaveProperty("feeCurrencyUnwrapped");
    expect(patch).not.toHaveProperty("feeCurrencyAccountId");
  });

  it("Stellar: declares a default strategy that clears feesStrategy + fees + customFees", () => {
    expect(sendFeatures.hasDefaultStrategy(stellar)).toBe(true);

    const patch = sendFeatures.getDefaultStrategyPatch(stellar);
    expect(patch).toEqual({
      feesStrategy: undefined,
      fees: undefined,
      customFees: undefined,
    });
  });

  it("EVM: has no default strategy (preset-based fees)", () => {
    expect(sendFeatures.hasDefaultStrategy(ethereum)).toBe(false);
    expect(sendFeatures.getDefaultStrategyPatch(ethereum)).toBeNull();
  });

  it("returns false/null for an undefined currency", () => {
    expect(sendFeatures.hasDefaultStrategy(undefined)).toBe(false);
    expect(sendFeatures.getDefaultStrategyPatch(undefined)).toBeNull();
  });
});
