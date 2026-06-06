import type { MarketListCategory } from "~/reducers/types";

export type MarketListRouteParams = {
  top100?: boolean;
  category?: MarketListCategory;
};
