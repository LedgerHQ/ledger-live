import React, { useCallback } from "react";
import Switch from "~/renderer/components/Switch";
import Track from "~/renderer/analytics/Track";
import { useSelector, useDispatch } from "react-redux";
import { setMarketWidget } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { marketPerformanceWidgetSelector } from "~/renderer/reducers/settings";

const MarketPerformanceWidgetRow = () => {
  const marketWidgetValue = useSelector(marketPerformanceWidgetSelector);

  const dispatch = useDispatch();

  const toggle = useCallback(
    (value: boolean) => {
      dispatch(setMarketWidget(value));

      track(
        "toggle_clicked",
        {
          toggleAction: value ? "ON" : "OFF",
          toggle: "MarketPerformanceWidget",
          page: "Page Settings General",
        },
        true,
      );
    },
    [dispatch],
  );

  return (
    <>
      <Track
        onUpdate
        event={
          marketWidgetValue
            ? "MarketPerformanceWidgetEnabled"
            : "MarketPerformanceWidgetRowDisabled"
        }
      />
      <Switch isChecked={marketWidgetValue} onChange={() => toggle(!marketWidgetValue)} />
    </>
  );
};
export default MarketPerformanceWidgetRow;
