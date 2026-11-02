import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  usePickAccountAssets,
  type AccountAssetPickerProps,
} from "@features/flow-account-detail-hero";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useCalculateCountervalueCallback } from "~/actions/general";
import type { AccountAsset } from "LLM/utils/accountAssets";

export type PickAccountAsset = (
  assets: readonly AccountAsset[],
  onPicked: (asset: AccountAsset) => void,
) => void;

export function usePickAccountAsset(): Readonly<{
  pickAsset: PickAccountAsset;
  pickerProps: AccountAssetPickerProps;
}> {
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const calculateCountervalue = useCalculateCountervalueCallback();

  return usePickAccountAssets<AccountAsset>({
    locale,
    discreet,
    counterValueUnit,
    calculateCountervalue,
    formatAmount: formatCurrencyUnit,
  });
}
