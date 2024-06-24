import React from "react";
import Switch from "~/renderer/components/Switch";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import Track from "~/renderer/analytics/Track";
const MarketPerformanceWidgetRow = () => {
  const featureFlagsProvider = useFeatureFlags();

  const currentValue = Boolean(
    featureFlagsProvider.getFeature("marketperformanceWidgetDesktop")?.enabled,
  );

  const update = (value: boolean) => {
    featureFlagsProvider.overrideFeature("marketperformanceWidgetDesktop", { enabled: value });
  };

  return (
    <>
      <Track
        onUpdate
        event={
          currentValue ? "MarketPerformanceWidgetEnabled" : "MarketPerformanceWidgetRowDisabled"
        }
      />
      <Switch isChecked={currentValue} onChange={() => update(!currentValue)} />
    </>
  );
};
export default MarketPerformanceWidgetRow;
