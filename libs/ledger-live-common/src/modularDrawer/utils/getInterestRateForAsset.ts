import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Apy } from "@domain/entity-interest-rate";

type InterestRateResult = {
  interestRate: Apy | undefined;
  interestRatePercentageRounded: number;
};

const roundPercentage = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * 100 * factor) / factor;
};

export function getInterestRateForAsset(
  asset: CryptoOrTokenCurrency,
  interestRates: Record<string, Apy | undefined>,
  networks: CryptoOrTokenCurrency[] = [],
): InterestRateResult {
  const currencyId =
    asset.type === "TokenCurrency"
      ? asset.id
      : (networks.find(n => n.type === "TokenCurrency" && n.parentCurrencyId === asset.id)?.id ??
        asset.id);

  const interestRate = interestRates[currencyId] ?? undefined;

  return {
    interestRate,
    interestRatePercentageRounded: interestRate ? roundPercentage(interestRate.value) : 0,
  };
}
