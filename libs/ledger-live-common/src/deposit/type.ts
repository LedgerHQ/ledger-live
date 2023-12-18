import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

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
  ledgerCurrency?: CryptoOrTokenCurrency;
};

export type GroupedCurrency = {
  providerId: string;
  currenciesByNetwork: MappedAsset[];
};

export type CurrenciesByProviderId = {
  currenciesByNetwork: CryptoOrTokenCurrency[];
  providerId: string;
};

export type GroupedCurrencies = {
  currenciesByProvider: CurrenciesByProviderId[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
};
