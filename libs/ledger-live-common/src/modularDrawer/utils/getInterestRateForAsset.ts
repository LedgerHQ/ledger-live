import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ApyType } from "../../dada-client/types/trend";

type InterestRate = { value: number; type: ApyType };
type InterestRateResult = {
  interestRate: InterestRate | undefined;
  interestRatePercentageRounded: number;
};

const roundPercentage = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * 100 * factor) / factor;
};

export function getInterestRateForAsset(
  asset: CryptoOrTokenCurrency,
  interestRates: Record<string, InterestRate | undefined>,
  networks: CryptoOrTokenCurrency[] = [],
): InterestRateResult {
  const currencyId =
    asset.type === "TokenCurrency"
      ? asset.id
      : networks.find(n => n.type === "TokenCurrency" && n.parentCurrency?.id === asset.id)?.id ??
        asset.id;

  const interestRate = interestRates[currencyId] ?? undefined;

  return {
    interestRate,
    interestRatePercentageRounded: interestRate ? roundPercentage(interestRate.value) : 0,
  };
}
