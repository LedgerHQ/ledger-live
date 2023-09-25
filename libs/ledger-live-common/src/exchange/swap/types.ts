import { BigNumber } from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, AccountRaw, AccountRawLike, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionRaw } from "../../generated/types";
import { Result as UseBridgeTransactionResult } from "../../bridge/useBridgeTransaction";

export type Exchange = {
  fromParentAccount: Account | null | undefined;
  fromAccount: AccountLike;
  toParentAccount: Account | null | undefined;
  toAccount: AccountLike;
};
export type ExchangeRaw = {
  fromParentAccount: AccountRaw | null | undefined;
  fromAccount: AccountRawLike;
  toParentAccount: AccountRaw | null | undefined;
  toAccount: AccountRawLike;
};
export type ExchangeRate = {
  rate: BigNumber | undefined;
  // NB Raw rate, for display
  magnitudeAwareRate: BigNumber;
  // NB rate between satoshi units
  payoutNetworkFees?: BigNumber;
  // Only for float
  toAmount: BigNumber;
  // There's a delta somewhere between from times rate and the api.
  rateId?: string;
  provider: string;
  providerType: ExchangeProviderType;
  tradeMethod: "fixed" | "float";
  error?: Error;
  providerURL?: string;
  expirationTime?: number;
};

type ExchangeProviderType = "CEX" | "DEX";

type ExchangeRateCommonRaw = {
  provider: string;
  providerType: ExchangeProviderType;
  from: string;
  to: string;
  amountFrom: string;
  amountRequested?: string;
  amountTo: string;
  payoutNetworkFees: string;
  status: "success";
  errorCode?: number;
  errorMessage?: string;
  providerURL?: string;
};

type ExchangeRateFloatRateRaw = ExchangeRateCommonRaw & {
  tradeMethod: "float";
  rateId?: string;
  minAmountFrom: string;
  maxAmountFrom?: string;
};

type ExchangeRateFixedRateRaw = ExchangeRateCommonRaw & {
  tradeMethod: "fixed";
  rateId: string;
  expirationTime: string;
  rate: string;
};

type ExchangeRateErrorCommon = {
  status: "error";
  tradeMethod: TradeMethod;
  from: string;
  to: string;
  providerType: ExchangeProviderType;
  provider: string;
};

type ExchangeRateErrorDefault = ExchangeRateErrorCommon & {
  errorCode: number;
  errorMessage: string;
};

type ExchangeRateErrorMinMaxAmount = ExchangeRateErrorCommon & {
  amountRequested: string;
  minAmountFrom: string;
  maxAmountFrom: string;
};

export type ExchangeRateErrors = ExchangeRateErrorDefault | ExchangeRateErrorMinMaxAmount;

export type ExchangeRateResponseRaw =
  | ExchangeRateFloatRateRaw
  | ExchangeRateFixedRateRaw
  | ExchangeRateErrors;

export type TradeMethod = "fixed" | "float";

export type ExchangeRateRaw = {
  rate: string;
  magnitudeAwareRate: string;
  payoutNetworkFees?: string;
  toAmount: string;
  rateId?: string;
  provider: string;
  providerType: "CEX" | "DEX";
  tradeMethod: TradeMethod;
  error?: string;
  providerURL?: string;
};

export type AvailableProviderV2 = {
  provider: string;
  supportedCurrencies: string[];
};

export type AvailableProviderV3 = {
  provider: string;
  pairs: Pair[];
};

export interface Pair {
  from: string;
  to: string;
  tradeMethod: string;
}

export type GetProviders = () => Promise<AvailableProvider[]>;

type TradeMethodGroup = {
  methods: TradeMethod[];
  pairs: {
    [currencyIndex: number]: number[];
  };
};

export type ProvidersResponseV4 = {
  currencies: { [currencyIndex: number]: string };
  providers: { [providerName: string]: TradeMethodGroup[] };
};

export type AvailableProvider = AvailableProviderV3;

export type ExchangeObject = {
  exchange: Exchange;
  transaction: Transaction;
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null;
  providers?: AvailableProviderV3[];
  timeout?: number;
  timeoutErrorMessage?: string;
};

export type GetExchangeRates = (
  exchangeObject: ExchangeObject,
) => Promise<(ExchangeRate & { expirationDate?: Date })[]>;

export type InitSwapResult = {
  transaction: Transaction;
  swapId: string;
};

type ValidSwapStatus = "pending" | "onhold" | "expired" | "finished" | "refunded";

export type SwapStatusRequest = {
  provider: string;
  swapId: string;
};
export type SwapStatus = {
  provider: string;
  swapId: string;
  status: ValidSwapStatus;
};

// -----
// Related to Swap state API call (accepted or cancelled)

type SwapStateRequest = {
  provider: string;
  swapId: string;
};

export type SwapStateAcceptedRequest = SwapStateRequest & {
  transactionId: string;
};

export type SwapStateCancelledRequest = SwapStateRequest;

export type PostSwapAccepted = (arg0: SwapStateAcceptedRequest) => Promise<null>;

export type PostSwapCancelled = (arg0: SwapStateCancelledRequest) => Promise<null>;

// -----

export type UpdateAccountSwapStatus = (arg0: Account) => Promise<Account | null | undefined>;
export type GetMultipleStatus = (arg0: SwapStatusRequest[]) => Promise<SwapStatus[]>;
export type SwapRequestEvent =
  | { type: "init-swap" }
  | {
      type: "init-swap-requested";
      amountExpectedTo?: string;
      estimatedFees: BigNumber;
    }
  | {
      type: "init-swap-error";
      error: Error;
      swapId: string;
    }
  | {
      type: "init-swap-result";
      initSwapResult: InitSwapResult;
    };

export type SwapHistorySection = {
  day: Date;
  data: MappedSwapOperation[];
};
export type MappedSwapOperation = {
  fromAccount: AccountLike;
  fromParentAccount?: Account;
  toAccount: AccountLike;
  toParentAccount?: Account;
  toExists: boolean;
  operation: Operation;
  provider: string;
  swapId: string;
  status: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
};
export type SwapOperation = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
};
export type SwapOperationRaw = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: string;
  toAmount: string;
};
export type SwapState = {
  // NB fromAccount and fromParentAccount and amount come from `useBridgeTransaction`
  useAllAmount?: boolean;
  loadingRates?: boolean;
  isTimerVisible?: boolean;
  error?: Error | null | undefined;
  fromCurrency?: (CryptoCurrency | TokenCurrency) | null | undefined;
  toCurrency?: (CryptoCurrency | TokenCurrency) | null | undefined;
  toAccount?: AccountLike | null | undefined;
  toParentAccount?: Account | null | undefined;
  ratesExpiration?: Date | null | undefined;
  exchangeRate?: ExchangeRate | null | undefined;
  withExpiration?: boolean;
};

export type SwapTransaction = Transaction & {
  tag?: number;
  memoValue?: string;
  memoType?: string;
};

export type InitSwapInput = {
  exchange: Exchange;
  exchangeRate: ExchangeRate;
  transaction: SwapTransaction;
  deviceId: string;
};

export type InitSwapInputRaw = {
  exchange: ExchangeRaw;
  exchangeRate: ExchangeRateRaw;
  transaction: TransactionRaw;
  deviceId: string;
};

export interface CustomMinOrMaxError extends Error {
  amount: BigNumber;
}

export type SwapSelectorStateType = {
  currency: TokenCurrency | CryptoCurrency | undefined;
  account: AccountLike | undefined;
  parentAccount: Account | undefined;
  amount: BigNumber | undefined;
};

export type OnNoRatesCallback = (arg: {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
}) => void;

export type OnBeforeFetchRates = () => void;

export type RatesReducerState = {
  status?: string | null;
  value?: ExchangeRate[];
  error?: Error;
};

export type SwapDataType = {
  from: SwapSelectorStateType;
  to: SwapSelectorStateType;
  isMaxEnabled: boolean;
  isMaxLoading: boolean;
  isSwapReversable: boolean;
  rates: RatesReducerState;
  refetchRates: () => void;
  updateSelectedRate: (selected?: ExchangeRate) => void;
  targetAccounts?: Account[];
};

export type SwapTransactionType = UseBridgeTransactionResult & {
  swap: SwapDataType;
  setFromAccount: (account: SwapSelectorStateType["account"]) => void;
  setToAccount: (
    currency: SwapSelectorStateType["currency"],
    account: SwapSelectorStateType["account"],
    parentAccount: SwapSelectorStateType["parentAccount"],
  ) => void;
  setFromAmount: (amount: BigNumber) => void;
  setToAmount: (amount: BigNumber) => void;
  setToCurrency: (currency: SwapSelectorStateType["currency"]) => void;
  toggleMax: () => void;
  reverseSwap: () => void;
  fromAmountError?: Error;
  fromAmountWarning?: Error;
};
