import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

export type RangeKey = "24h" | "7d" | "30d" | "1y";

export const RANGE_TO_PRICE_CHANGE_KEY: Record<RangeKey, KeysPriceChange> = {
  "24h": KeysPriceChange.day,
  "7d": KeysPriceChange.week,
  "30d": KeysPriceChange.month,
  "1y": KeysPriceChange.year,
};
