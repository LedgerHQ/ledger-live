import { PerformanceMarketDatapoint } from "@ledgerhq/live-countervalues/portfolio";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { Dispatch, SetStateAction } from "react";

/**
 * MarketPerformanceWidget Hook
 */
export type State = {
  isLoading: boolean;
  hasError: boolean;
};

export type Props = {
  variant: ABTestingVariants;
  list: PerformanceMarketDatapoint[];
  order: Order;
  setOrder: Dispatch<SetStateAction<Order>>;
  state: State;
  setState: Dispatch<SetStateAction<State>>;
};

/**
 * MarketPerformanceWidgetHeader
 */
export type HeaderProps = {
  onChangeOrder: React.Dispatch<React.SetStateAction<Order>>;
  order: Order;
};

/**
 * MarketPerformanceWidgetBody
 */
export type PropsBody = {
  data: PerformanceMarketDatapoint[];
  order: Order;
};

export type PropsBodyElem = {
  data: PerformanceMarketDatapoint;
  index: number;
  isFirst: boolean;
};

/**
 * Enums
 */

export enum Order {
  asc = "asc",
  desc = "desc",
}
