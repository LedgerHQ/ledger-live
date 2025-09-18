import { InterestRate } from "../entities";
import { createCurrencyDataSelector, ApiState } from "./selectorUtils";

export const selectInterestRateByCurrency: (
  state: ApiState,
  currencyId: string,
) => InterestRate | undefined = createCurrencyDataSelector<InterestRate>("interestRates");
