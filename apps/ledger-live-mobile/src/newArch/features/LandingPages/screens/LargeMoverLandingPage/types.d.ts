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

export type { InformationsProps };
