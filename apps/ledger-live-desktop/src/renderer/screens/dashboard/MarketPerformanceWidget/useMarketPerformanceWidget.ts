import {
  PerformanceMarketDatapoint,
  makePerformanceMarketAssetsList,
} from "@ledgerhq/live-countervalues/portfolio";
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

const LIMIT = 5;

export function getSlicedList(list: PerformanceMarketDatapoint[], order: Order) {
  const start = order === Order.asc ? 0 : list.length - LIMIT;
  const end = order === Order.asc ? LIMIT : list.length;

  return list
    .slice(start, end)
    .filter(elem => (order === Order.asc ? elem.change > 0 : elem.change < 0))
    .sort((a, b) => (order === Order.asc ? b.change - a.change : a.change - b.change));
}

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

  const sliced = useMemo(() => getSlicedList(list, order), [list, order]);

  return {
    list: sliced,
    order,
    setOrder,
    state,
    setState,
  };
}
