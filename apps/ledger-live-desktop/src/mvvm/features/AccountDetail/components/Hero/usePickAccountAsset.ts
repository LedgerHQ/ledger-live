import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  usePickAccountAssets,
  type AccountAssetPickerProps,
} from "@features/flow-account-detail-hero";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import type { AccountAsset } from "./types";

export type PickAccountAsset = (
  assets: readonly AccountAsset[],
  onPicked: (asset: AccountAsset) => void,
) => void;

const PICKER_TEST_ID = "account-detail-asset-picker";

export function usePickAccountAsset(): Readonly<{
  pickAsset: PickAccountAsset;
  pickerProps: AccountAssetPickerProps;
}> {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const calculateCountervalue = useCalculateCountervalueCallback();

  return usePickAccountAssets<AccountAsset>({
    locale,
    discreet,
    counterValueUnit,
    calculateCountervalue,
    formatAmount: formatCurrencyUnit,
    testID: PICKER_TEST_ID,
  });
}
