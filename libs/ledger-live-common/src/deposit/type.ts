import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

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
  ledgerCurrency?: CryptoCurrency | TokenCurrency;
};

export type GroupedCurrency = {
  providerId: string;
  currenciesByNetwork: MappedAsset[];
};
