import { z } from "zod";

/** One chart sample: `[timestamp in ms, price]`. */
export const ChartDataPointSchema = z.tuple([z.number(), z.number()]);

/** Chart series keyed by range, as the UI reads them: `{ "24h": [[ts, price], ...] }`. */
export const MarketCoinDataChartSchema = z.record(z.string(), z.array(ChartDataPointSchema));
