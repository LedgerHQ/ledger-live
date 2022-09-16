import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountLike,
  AccountRaw,
  AccountRawLike,
  Operation,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../../generated/types";

/// v3 changes here, move me to another folder soon
export type ValidKYCStatus = "open" | "pending" | "approved" | "closed";
export type KYCStatus = { id: string; status: ValidKYCStatus };
export type GetKYCStatus = (arg0: string, arg1: string) => Promise<KYCStatus>;
export type SubmitKYC = (
  str: string,
  KYCData
) => Promise<KYCStatus | { error: Error }>;

export type KYCData = {
  firstName: string;
  lastName: string;
  residenceAddress: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
};
///

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
  rate: BigNumber;
  // NB Raw rate, for display
  magnitudeAwareRate: BigNumber;
  // NB rate between satoshi units
  payoutNetworkFees?: BigNumber;
  // Only for float
  toAmount: BigNumber;
  // There's a delta somewhere between from times rate and the api.
  rateId?: string;
  provider: string;
  tradeMethod: "fixed" | "float";
  error?: Error;
  providerURL?: string | null | undefined;
};
export type TradeMethod = "fixed" | "float";
export type ExchangeRateRaw = {
  rate: string;
  magnitudeAwareRate: string;
  payoutNetworkFees?: string;
  toAmount: string;
  rateId?: string;
  provider: string;
  tradeMethod: TradeMethod;
  error?: string;
  providerURL?: string | null | undefined;
};
export type AvailableProviderV2 = {
  provider: string;
  supportedCurrencies: string[];
};
export type AvailableProviderV3 = {
  provider: string;
  pairs: Array<{ from: string; to: string; tradeMethod: string }>;
};

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

type CheckQuoteOkStatus = {
  codeName: "RATE_VALID";
};

type ValidCheckQuoteErrorCodes =
  | "UNKNOW_USER"
  | "KYC_UNDEFINED"
  | "KYC_PENDING"
  | "KYC_FAILED"
  | "KYC_UPGRADE_REQUIRED"
  | "OVER_TRADE_LIMIT"
  | "UNKNOWN_ERROR"
  | "WITHDRAWALS_BLOCKED"
  | "MFA_REQUIRED"
  | "RATE_NOT_FOUND";

type CheckQuoteErrorStatus = {
  codeName: ValidCheckQuoteErrorCodes;
  error: string;
  description: string;
};

export type CheckQuoteStatus = CheckQuoteOkStatus | CheckQuoteErrorStatus;

export type CheckQuote = ({
  provider,
  quoteId,
  bearerToken,
}: {
  provider: string;
  quoteId: string;
  bearerToken: string;
}) => Promise<CheckQuoteStatus>;
export type AvailableProvider = AvailableProviderV2 | AvailableProviderV3;
export type GetExchangeRates = (
  arg0: Exchange,
  arg1: Transaction,
  wyreUserId?: string,
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null
) => Promise<ExchangeRate[]>;
export type GetProviders = () => Promise<AvailableProvider[]>;
export type InitSwapResult = {
  transaction: Transaction;
  swapId: string;
};

type ValidSwapStatus =
  | "pending"
  | "onhold"
  | "expired"
  | "finished"
  | "refunded";
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

export type PostSwapAccepted = (
  arg0: SwapStateAcceptedRequest
) => Promise<null>;

export type PostSwapCancelled = (
  arg0: SwapStateCancelledRequest
) => Promise<null>;

// -----

export type UpdateAccountSwapStatus = (
  arg0: Account
) => Promise<Account | null | undefined>;
export type GetMultipleStatus = (
  arg0: SwapStatusRequest[]
) => Promise<SwapStatus[]>;
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
  userId?: string; // Nb for kyc purposes
};
export type InitSwapInputRaw = {
  exchange: ExchangeRaw;
  exchangeRate: ExchangeRateRaw;
  transaction: TransactionRaw;
  deviceId: string;
  userId?: string;
};

export interface CustomMinOrMaxError extends Error {
  amount: BigNumber;
}
