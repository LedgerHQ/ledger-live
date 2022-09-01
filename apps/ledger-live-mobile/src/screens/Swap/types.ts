import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { CurrenciesStatus } from "@ledgerhq/live-common/exchange/swap/logic";
import {
  AvailableProvider,
  ExchangeRate,
  SwapTransaction,
} from "@ledgerhq/live-common/exchange/swap/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";

export type SwapRouteParams = {
  swap: SwapDataType;
  exchangeRate: ExchangeRate;
  currenciesStatus: CurrenciesStatus;
  selectableCurrencies: (CryptoCurrency | TokenCurrency)[];
  transaction?: SwapTransaction;
  status?: TransactionStatus;
  selectedCurrency: CryptoCurrency | TokenCurrency;
  providers: AvailableProvider[];
  provider: string;
  installedApps: string[];
  target: "from" | "to";
  rateExpiration?: Date;
  rate?: ExchangeRate;
  rates?: ExchangeRate[];
  tradeMethod?: string;
  setAccount?: (account?: Account | TokenAccount) => void;
  setCurrency?: (currency?: TokenCurrency | CryptoCurrency) => void;
};
