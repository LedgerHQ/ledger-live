import { PartialMarketItemResponse } from "@ledgerhq/live-common/market/utils/types";

type InformationsProps = PartialMarketItemResponse & {
  ticker: string;
};

type CardType = {
  id: string;
  data?: PartialMarketItemResponse | undefined;
  chartData?: MarketCoinDataChart | undefined;
  idCard: number;
};

export type { InformationsProps, CardType };
