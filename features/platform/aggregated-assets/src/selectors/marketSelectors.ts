import { PartialMarketItemResponse } from "@domain/api-aggregated-assets";
import { createCurrencyDataSelector, ApiState } from "./selectorUtils";

export const selectMarketByCurrency: (
  state: ApiState,
  currencyId: string,
) => PartialMarketItemResponse | undefined =
  createCurrencyDataSelector<PartialMarketItemResponse>("markets");
