import { useCallback } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { ACCOUNT_DETAIL_PAGES } from "@features/flow-account-detail";
import {
  usePickAccountAssets,
  type AccountAssetPickerProps,
} from "@features/flow-account-detail-hero";
import { track, trackPage } from "@shared/analytics";
import { EVENTS_NAME } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import { formatAssetsConfig } from "LLD/features/ModularDialog/analytics/utils";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import type { AccountAsset } from "./types";

/** `flow` is the action the picker serves (send, sell, earn...), like the flow of the MAD. */
export type PickAccountAsset = (
  assets: readonly AccountAsset[],
  onPicked: (asset: AccountAsset) => void,
  flow: string,
) => void;

const PICKER_TEST_ID = "account-detail-asset-picker";

// The picker lists the balance of each asset: tracked as the MAD does for that configuration.
const ASSETS_CONFIG: EnhancedModularDrawerConfiguration["assets"] = { rightElement: "balance" };

export function usePickAccountAsset(): Readonly<{
  pickAsset: PickAccountAsset;
  pickerProps: AccountAssetPickerProps;
}> {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const calculateCountervalue = useCalculateCountervalueCallback();

  const { pickAsset: pickFromPicker, pickerProps } = usePickAccountAssets<AccountAsset>({
    locale,
    discreet,
    counterValueUnit,
    calculateCountervalue,
    formatAmount: formatCurrencyUnit,
    testID: PICKER_TEST_ID,
  });

  const pickAsset = useCallback<PickAccountAsset>(
    (assets, onPicked, flow) => {
      if (assets.length > 1) {
        trackPage(
          {
            category: EVENTS_NAME.MODULAR_ASSET_SELECTION,
            props: {
              source: ACCOUNT_DETAIL_PAGES.account,
              flow,
              asset_component_features: formatAssetsConfig(ASSETS_CONFIG),
            },
          },
          { updateRoutes: false },
        );
      }
      pickFromPicker(assets, asset => {
        if (assets.length > 1) {
          track(EVENTS_NAME.ASSET_CLICKED, {
            asset: asset.currency.name,
            page: EVENTS_NAME.MODULAR_ASSET_SELECTION,
            asset_component_features: formatAssetsConfig(ASSETS_CONFIG),
            flow,
            source: ACCOUNT_DETAIL_PAGES.account,
          });
        }
        onPicked(asset);
      });
    },
    [pickFromPicker],
  );

  return { pickAsset, pickerProps };
}
