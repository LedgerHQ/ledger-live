import React, { useMemo } from "react";
import { makePerformanceMarketAssetsList } from "@ledgerhq/live-countervalues/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import {
  useMarketPerformanceReferenceDate,
  useMarketPerformanceTrackingPairs,
} from "~/renderer/actions/marketperformance";

type Props = unknown;

function usePerformanceMarketAssetsList() {
  const cvsState = useCountervaluesState();
  const countervalue = useSelector(counterValueCurrencySelector);
  const assets = useMarketPerformanceTrackingPairs(countervalue);
  const referenceDate = useMarketPerformanceReferenceDate();
  return useMemo(
    () =>
      makePerformanceMarketAssetsList(
        cvsState,
        countervalue,
        assets.map(a => a.from),
        referenceDate,
      ),
    [cvsState, countervalue, assets, referenceDate],
  );
}

const PortfolioGraphCard = (_: Props) => {
  const list = usePerformanceMarketAssetsList();
  console.log(
    list.map(o => o.currency.name + " \t" + Math.round(o.change * 10000) / 100 + "%").join("\n"),
  );
  return null;
};

export default React.memo(PortfolioGraphCard);
