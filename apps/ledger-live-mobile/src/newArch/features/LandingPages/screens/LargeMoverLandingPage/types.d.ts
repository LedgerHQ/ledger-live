type InformationsProps = {
  price: number;
  ticker: string;
  marketCap: number | undefined;
  volume: number;
  marketCapPercent: number;
  fdv: number;
  circulatingSupply: number;
  totalSupply: number;
  allTimeHigh: number;
  allTimeHighDate: Date;
  allTimeLow: number;
  allTimeLowDate: Date;
};

type CardType = {
  data?: CurrencyData | undefined;
  chartData?: MarketCoinDataChart | undefined;
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
};

export type { InformationsProps, CardType };
