import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function useAssetSuggestionsSectionViewModel() {
  const locale = useSelector(localeSelector);
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker;

  return { locale, counterCurrency };
}
