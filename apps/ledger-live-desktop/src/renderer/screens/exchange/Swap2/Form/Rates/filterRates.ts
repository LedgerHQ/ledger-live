import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { FILTER } from "~/renderer/screens/exchange/Swap2/Form/utils";
export const filterRates = (
  rates: ExchangeRate[] | undefined,
  filters: string[],
): ExchangeRate[] => {
  let filteredRates = rates ?? [];
  for (const filter of filters) {
    switch (filter) {
      case FILTER.centralised:
        filteredRates = filteredRates.filter(rate => rate.providerType === "CEX");
        break;
      case FILTER.decentralised:
        filteredRates = filteredRates.filter(rate => rate.providerType === "DEX");
        break;
      case FILTER.float:
        filteredRates = filteredRates.filter(rate => rate.tradeMethod === "float");
        break;
      case FILTER.fixed:
        filteredRates = filteredRates.filter(rate => rate.tradeMethod === "fixed");
    }
  }
  return filteredRates;
};
