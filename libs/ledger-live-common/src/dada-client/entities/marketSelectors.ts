import { PartialMarketItemResponse } from "../../market/utils/types";
import { createCurrencyDataSelector, ApiState } from "./selectorUtils";

export const selectMarketByCurrency: (
  state: ApiState,
  currencyId: string,
) => PartialMarketItemResponse | undefined =
  createCurrencyDataSelector<PartialMarketItemResponse>("markets");
