export interface GenerateByTypeOptions {
  includeCryptos: boolean;
  includeStablecoins: boolean;
  includeStocks: boolean;
  includeTestnet: boolean;
  count: number;
}

export interface GenerateByCurrencyOptions {
  currencyIds: string[];
  tokenIds: string[];
  accountsPerCurrency: number;
}

export interface GenerateEmptyOptions {
  currencyIds: string[];
  accountsPerCurrency: number;
}

export interface MockAccountsToolProps {
  generateRandom: (count: number) => void | Promise<void>;
  generateByCurrency: (options: GenerateByCurrencyOptions) => void | Promise<void>;
  generateByType: (options: GenerateByTypeOptions) => void | Promise<void>;
  generateEmpty: (options: GenerateEmptyOptions) => void | Promise<void>;
  clearAccounts: () => void;
  stocksLoading: boolean;
  stablecoinsLoading: boolean;
}
