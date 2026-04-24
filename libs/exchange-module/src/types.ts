import { RawTransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}

export type ExchangeStartParams =
  | ExchangeStartFundParams
  | ExchangeStartSellParams
  | ExchangeStartSwapParams;

export type ExchangeStartFundParams = {
  exchangeType: "FUND";
  provider: string;
  fromAccountId: string;
};

export type ExchangeStartSellParams = {
  exchangeType: "SELL";
  provider: string;
  fromAccountId: string;
};

export type ExchangeStartSwapParams = {
  exchangeType: "SWAP";
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  tokenCurrency?: string;
};

export type ExchangeSwapParams = ExchangeStartSwapParams & {
  fromAmount: string;
  fromAmountAtomic: BigNumber;
  quoteId?: string;
  toNewTokenId?: string;
  feeStrategy: "slow" | "medium" | "fast" | "custom";
  customFeeConfig?: {
    [key: string]: BigNumber;
  };
  swapAppVersion?: string;
  sponsored?: boolean;
  isEmbedded?: boolean;
  correlationId?: string;
};

export type ExchangeStartResult = {
  transactionId: string;
  device?: { deviceId?: string; modelId?: string };
};

export type ExchangeFundResult = {
  transactionId: string;
  device?: { deviceId?: string; modelId?: string };
};

export type ExchangeCompleteBaseParams = {
  provider: string;
  fromAccountId: string;
  rawTransaction: RawTransaction;
  hexBinaryPayload: string;
  hexSignature: string;
  feeStrategy: "slow" | "medium" | "fast" | "custom";
  tokenCurrency?: string;
};

export type ExchangeCompleteFundParams = ExchangeCompleteBaseParams & {
  exchangeType: "FUND";
};

export type ExchangeCompleteSellParams = ExchangeCompleteBaseParams & {
  exchangeType: "SELL";
};

export type ExchangeCompleteSwapParams = ExchangeCompleteBaseParams & {
  exchangeType: "SWAP";
  toAccountId: string;
  swapId: string;
};

export type ExchangeCompleteParams =
  | ExchangeCompleteFundParams
  | ExchangeCompleteSellParams
  | ExchangeCompleteSwapParams;

export type ExchangeCompleteResult = {
  transactionHash: string;
};

export type SwapResult = {
  operationHash: string;
  swapId: string;
};

export type SwapLiveError = {
  name: string;
  message: string;
  type?: string;
  cause: {
    message?: string;
    swapCode?: string;
    response?: {
      data?: {
        error?: { messageKey?: string; message?: string };
      };
    };
  };
};

// --- Swap quotes (`custom.exchange.getQuotes` wire) — keep internal HTTP shapes in ledger-live-common only ---

export type UniswapOrderType = "classic" | "uniswapxv2" | "all";

export type QuotesInput = {
  amount: string;
  sendAccountId: string;
  receiveAccountId: string;
  sendAddress: string;
  receiveAddress: string;
  sendCurrencyId: string;
  receiveCurrencyId: string;
  counterValueCurrency: string;
  networkFeesCurrencyId?: string;
  slippage?: number;
  uniswapOrderType?: UniswapOrderType;
};

export type GetQuotesArgs = {
  providers: string[];
  data: QuotesInput;
  headers?: Array<[string, string]>;
  signal?: AbortSignal;
};

export type GetQuotesWireArgs = Omit<GetQuotesArgs, "signal">;

export type TradeMethod = "fixed" | "float";

export type ProviderTypes = "DEX" | "CEX";

export type QuoteWarning = "highSpread";

export type QuoteError = "notEnoughBalanceForFees";

export type ProviderDetails = {
  name: string;
  type: ProviderTypes;
  url?: string;
  isUniswapX: boolean;
  requiresKYC: boolean;
  continuesInProviderLiveApp: boolean;
};

export type QuoteNetworkFees = {
  currencyId: string;
  gasLimit?: string;
};

export type QuoteDetails = {
  type: TradeMethod;
  sendAmount: number;
  receiveAmount: number;
  gasLess: boolean;
  networkFees: QuoteNetworkFees;
  slippage: number;
  exchangeRate: number;
};

export type Quote = {
  id?: string;
  key: string;
  provider: string;
  providerDetails: ProviderDetails;
  quoteDetails: QuoteDetails;
  warning: QuoteWarning | null;
  error: QuoteError | null;
};

/** Error rows returned next to quotes (swap API error objects). */
export type QuoteProviderError = {
  code: string;
  type: TradeMethod;
  provider: string;
  message: string;
  parameter: { [key: string]: string };
};

export type GetQuotesResponse = {
  quotes: Quote[];
  errors: QuoteProviderError[];
};
