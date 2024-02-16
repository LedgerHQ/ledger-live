import { PerformanceMarketDatapoint } from "@ledgerhq/live-countervalues/portfolio";
import { ABTestingVariants } from "@ledgerhq/types-live";

export type HeaderProps = {
  onChangeOrder: React.Dispatch<React.SetStateAction<Order>>;
  order: Order;
};

export type PropsBody = {
  data: PerformanceMarketDatapoint[];
  order: Order;
};

export type PropsBodyElem = {
  data: PerformanceMarketDatapoint;
  index: number;
  isFirst: boolean;
};

export type Props = {
  variant: ABTestingVariants;
  data: PerformanceMarketDatapoint[];
};

export enum Order {
  asc = "asc",
  desc = "desc",
}
