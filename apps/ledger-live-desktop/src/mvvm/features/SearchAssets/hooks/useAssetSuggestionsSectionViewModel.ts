import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";

export function useAssetSuggestionsSectionViewModel() {
  const locale = useSelector(localeSelector);

  return { locale };
}
