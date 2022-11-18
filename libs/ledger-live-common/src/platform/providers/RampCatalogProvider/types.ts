export type PaymentServiceProvider =
  | "visa"
  | "mastercard"
  | "maestro"
  | "paypal"
  | "sepa"
  | "ach"
  | "applepay"
  | "googlepay";

export type QueryParams = {
  accountId?: string;
  accountAddress?: string;
  language?: string;
  fiatCurrencyId?: string;
  cryptoCurrencyId?: string;
  primaryColor?: string;
  mode?: string;
  fiatAmount?: string;
  cryptoAmount?: string;
  address?: string;
  theme?: string;
};

export type CryptoCurrency = {
  id: string;
  providerId: string;
  ticker: string;
};

export interface GenericRampCatalogEntry {
  name: string;
  paramsMapping: QueryParams;
  paymentProviders: PaymentServiceProvider[];
  cryptoCurrencies: CryptoCurrency[];
  fiatCurrencies: string[];
}

export interface RampLiveAppCatalogEntry extends GenericRampCatalogEntry {
  type: "LIVE_APP";
  appId: string;
}

export interface RampNativeCatalogEntry extends GenericRampCatalogEntry {
  type: "NATIVE";
  path: string;
}

export type RampCatalogEntry = RampLiveAppCatalogEntry | RampNativeCatalogEntry;

export type RampCatalog = {
  onRamp: RampCatalogEntry[];
  offRamp: RampCatalogEntry[];
};
