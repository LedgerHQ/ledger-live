import { makePerformanceMarketAssetsList } from "@ledgerhq/live-countervalues/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import {
  useMarketPerformanceReferenceDate,
  useMarketPerformanceTrackingPairs,
} from "~/renderer/actions/marketperformance";
import { useEffect, useMemo, useState } from "react";
import { Order, State } from "./types";

const TIMEOUT = 7500;

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

export function useMarketPerformanceWidget() {
  const [order, setOrder] = useState<Order>(Order.asc);
  const [state, setState] = useState<State>({
    isLoading: false,
    hasError: false,
  });
  const list = usePerformanceMarketAssetsList();
  console.log(
    list.map(o => o.currency.name + " \t" + Math.round(o.change * 10000) / 100 + "%").join("\n"),
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (list.length === 0) {
      setState({ isLoading: true, hasError: false });

      timeout = setTimeout(() => {
        setState({ isLoading: false, hasError: true });
      }, TIMEOUT);
    } else {
      setState({ isLoading: false, hasError: false });
    }

    return () => clearTimeout(timeout);
  }, [list.length]);

  return {
    list,
    order,
    setOrder,
    state,
    setState,
  };
}
