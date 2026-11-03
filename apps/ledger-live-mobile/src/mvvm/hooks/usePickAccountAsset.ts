import { useCallback } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  usePickAccountAssets,
  type AccountAssetPickerProps,
} from "@features/flow-account-detail-hero";
import { track, trackPage } from "@shared/analytics";
import {
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "LLM/features/ModularDrawer/analytics/modularDrawer.types";
import { formatAssetsConfig } from "LLM/features/ModularDrawer/analytics/utils";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useCalculateCountervalueCallback } from "~/actions/general";
import type { AccountAsset } from "LLM/utils/accountAssets";

/** Tracked like the Modular Asset Drawer: same page, same click, same `flow` and `source`. */
export type AccountAssetPickerTracking = Readonly<{ flow: string; source: string }>;

export type PickAccountAsset = (
  assets: readonly AccountAsset[],
  onPicked: (asset: AccountAsset) => void,
  tracking?: AccountAssetPickerTracking,
) => void;

// The picker lists the balance of each asset: tracked as the MAD does for that configuration.
const ASSET_COMPONENT_FEATURES = formatAssetsConfig({ rightElement: "balance" });

export function usePickAccountAsset(): Readonly<{
  pickAsset: PickAccountAsset;
  pickerProps: AccountAssetPickerProps;
}> {
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const calculateCountervalue = useCalculateCountervalueCallback();

  const { pickAsset: pickFromPicker, pickerProps } = usePickAccountAssets<AccountAsset>({
    locale,
    discreet,
    counterValueUnit,
    calculateCountervalue,
    formatAmount: formatCurrencyUnit,
  });

  const pickAsset = useCallback<PickAccountAsset>(
    (assets, onPicked, tracking) => {
      if (!tracking || assets.length <= 1) {
        pickFromPicker(assets, onPicked);
        return;
      }
      trackPage(
        {
          category: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          props: { ...tracking, asset_component_features: ASSET_COMPONENT_FEATURES },
        },
        { updateRoutes: false },
      );
      pickFromPicker(assets, asset => {
        track(EVENTS_NAME.ASSET_CLICKED, {
          ...tracking,
          asset_component_features: ASSET_COMPONENT_FEATURES,
          asset: asset.currency.name,
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
        });
        onPicked(asset);
      });
    },
    [pickFromPicker],
  );

  return { pickAsset, pickerProps };
}
