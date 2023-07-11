export type MappedAsset = {
  $type: "Token" | "Coin";
  ledgerId: string;
  providerId: string;
  name: string;
  ticker: string;
  network?: string;
  contract?: string;
  status: string;
  reason: null;
  data: {
    img: string;
    marketCapRank: number | null;
  };
};

export type GroupedCurrency = {
  names: object;
  providerId: string;
  currenciesByNetwork: MappedAsset[];
  ticker: string;
  name: string;
};
