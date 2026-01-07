import { getInterestRateForAsset } from "../getInterestRateForAsset";
import {
  mockEthCryptoCurrency,
  mockScrollCryptoCurrency,
  usdcToken,
} from "../../__mocks__/currencies.mock";
import { ApyType } from "../../../dada-client/types/trend";

describe("getInterestRateForAsset", () => {
  const networks = [mockEthCryptoCurrency, usdcToken];
  const interestRates: Record<string, { value: number; type: ApyType }> = {
    [mockEthCryptoCurrency.id]: { value: 0.05, type: "APY" },
    [usdcToken.id]: { value: 0.042927, type: "NRR" },
  };

  it("returns correct rate for CryptoCurrency asset", () => {
    const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
      mockEthCryptoCurrency,
      interestRates,
    );
    expect(interestRate).toEqual({ value: 0.05, type: "APY" });
    expect(interestRatePercentageRounded).toBe(5);
  });

  it("returns correct rate for TokenCurrency (parentCurrency) asset", () => {
    const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
      usdcToken,
      interestRates,
      networks,
    );
    expect(interestRate).toEqual({ value: 0.042927, type: "NRR" });
    expect(interestRatePercentageRounded).toBeCloseTo(4.29, 2);
  });

  it("returns undefined and 0 if no rate found", () => {
    const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
      mockScrollCryptoCurrency,
      interestRates,
      networks,
    );
    expect(interestRate).toBeUndefined();
    expect(interestRatePercentageRounded).toBe(0);
  });

  it("returns 0 if rate is 0", () => {
    const zeroNetworks = [mockEthCryptoCurrency];
    const zeroRates: Record<string, { value: number; type: ApyType }> = {
      ethereum: { value: 0, type: "APY" },
    };
    const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
      mockEthCryptoCurrency,
      zeroRates,
      zeroNetworks,
    );
    expect(interestRate).toEqual({ value: 0, type: "APY" });
    expect(interestRatePercentageRounded).toBe(0);
  });
});
