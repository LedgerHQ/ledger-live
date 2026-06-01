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

// Swap quotes (`custom.exchange.getQuotes`). Internal HTTP shapes live in ledger-live-common only.

export type UniswapOrderType = "classic" | "uniswapxv2" | "all";

export type QuotesInput = {
  amount: string;
  sendAccountId: string;
  receiveAccountId: string;
  sendAddress?: string;
  receiveAddress?: string;
  sendCurrencyId?: string;
  receiveCurrencyId?: string;
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

export enum QuoteWarningCodes {
  HIGH_VALUE_LOSS = "highValueLoss",
  NANO_S_PROVIDER_INCOMPATIBILITY = "nanoSProviderIncompatibility",
  UNREALISTIC_QUOTE = "unrealisticQuote",
  UNKNOWN_RECEIVE_FIAT_PRICE = "unknownReceiveFiatPrice",
}

export type QuoteWarning =
  | { code: QuoteWarningCodes.HIGH_VALUE_LOSS; lossPercent: number }
  | { code: QuoteWarningCodes.NANO_S_PROVIDER_INCOMPATIBILITY; provider: string }
  | { code: QuoteWarningCodes.UNREALISTIC_QUOTE; gainPercent: number }
  | { code: QuoteWarningCodes.UNKNOWN_RECEIVE_FIAT_PRICE };

export enum QuoteErrorCodes {
  NOT_ENOUGH_BALANCE_FOR_FEES = "notEnoughBalanceForFees",
}

export type QuoteError = { code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES };

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
  value?: number;
  gasLimit?: string;
};

/** Quote liquidity source; surfaced so consumers can render or sort on it. */
export type QuoteLiquiditySource = "RFQ" | "AMM";

/** Payout-chain network fee (fee paid on the destination chain, when applicable). */
export type QuotePayoutNetworkFees = {
  value: number;
  currencyId: string;
};

/** Flags advertised by the provider that affect the swap flow. */
export type QuoteTags = {
  isRegistrationRequired: boolean;
  isTokenApprovalRequired: boolean;
};

/** EVM token-approval transaction blob the swap SDK may need to broadcast. */
export type QuoteApprovalTransaction = {
  calldata: string;
  from: string;
  gasLimit: number;
  gasPrice: number;
  to: string;
  value: string;
};

/** Current token-allowance state for the send account / spender pair. */
export type QuoteTokenAllowance = {
  isApproved: boolean;
  approvedAmount?: string;
  approvalTransaction?: QuoteApprovalTransaction;
};

/**
 * EIP-712 Permit2 domain descriptor.
 * See https://eips.ethereum.org/EIPS/eip-712 and Uniswap's Permit2 contracts.
 */
export type QuotePermit2Domain = {
  name: string;
  chainId: number;
  verifyingContract: string;
};

/** Permit2 details: token + amount + expiration + nonce. */
export type QuotePermit2Details = {
  token: string;
  amount: string;
  expiration: string;
  nonce: string;
};

/** Permit2 single-permit payload. */
export type QuotePermit2Single = {
  details: QuotePermit2Details;
  spender: string;
  sigDeadline: string;
};

/** EIP-712 type descriptors for a Permit2 payload. */
export type QuotePermit2Types = {
  EIP712Domain: Array<{ name: string; type: string }>;
  PermitSingle: Array<{ name: string; type: string }>;
  PermitDetails: Array<{ name: string; type: string }>;
};

/**
 * Partial Permit2 typed-data payload. UniswapX populates `values`; 1inch-fusion
 * populates `message`. Consumers must tolerate missing fields.
 *
 * `primaryType` is widened to a free-form string: classic AMM Permit2 quotes
 * use `"PermitSingle"`, UniswapX RFQ orders use `"PermitWitnessTransferFrom"`,
 * and 1inch-fusion forwards its provider-supplied primary type as-is.
 */
export type QuotePermit2Message = {
  values?: QuotePermit2Single;
  message?: QuotePermit2Single;
  domain?: QuotePermit2Domain;
  types?: QuotePermit2Types;
  primaryType?: string;
};

/**
 * Provider-specific execution-time payload for quote submission. Only the
 * matching provider integration (UniswapX, 1inch-fusion, Velora) consumes it;
 * each subfield is populated only for its provider.
 */
export type QuotePermitData = {
  /** EIP-712 Permit2 typed-data payload (UniswapX, 1inch-fusion). */
  typedData?: QuotePermit2Message;
  /** 1inch-fusion order hash. */
  orderHash?: string;
  /** Velora price-route payload; opaque to this contract. */
  priceRoute?: unknown;
  /** Raw provider tag e.g. `"UniswapDutchCustomFields"`. */
  providerTag?: string;
};

/**
 * Wallet-computed network-fee estimate for the default fee strategy.
 * `amount` is in atomic units as a decimal string to preserve precision for
 * chains whose fees exceed `Number.MAX_SAFE_INTEGER`.
 */
export type QuoteEstimatedNetworkFee = {
  amount: string;
  currencyId: string;
};

/**
 * Extra network fee for a pre-swap ERC-20 approval transaction (EVM only).
 * Shaped identically to {@link QuoteEstimatedNetworkFee}. Absent when no
 * approval is required.
 */
export type QuoteApprovalNetworkFee = QuoteEstimatedNetworkFee;

export type QuoteDetails = {
  type: TradeMethod;
  sendAmount: number;
  receiveAmount: number;
  gasLess: boolean;
  networkFees: QuoteNetworkFees;
  slippage: number;
  exchangeRate: number;
  /** Additive optional fields; not every producer populates them. */
  liquiditySource?: QuoteLiquiditySource;
  payoutNetworkFees?: QuotePayoutNetworkFees;
  tokenAllowance?: QuoteTokenAllowance;
  tags?: QuoteTags;
  permitData?: QuotePermitData;
  estimatedNetworkFee?: QuoteEstimatedNetworkFee;
  approvalNetworkFee?: QuoteApprovalNetworkFee;
};

export type FormattedNumber = {
  numberValue: string;
  withPrefix: string;
  withSuffix: string;
};

export type FormattedQuoteValues = {
  sendAmount: FormattedNumber;
  sendAmountCountervalue: FormattedNumber;
  receiveAmount: FormattedNumber;
  receiveAmountCountervalue: FormattedNumber;
  networkFee: FormattedNumber;
  networkFeeCountervalue: FormattedNumber;
  rate: FormattedNumber;
  slippage: FormattedNumber;
};

export type Quote = {
  id?: string;
  key: string;
  provider: string;
  providerDetails: ProviderDetails;
  quoteDetails: QuoteDetails;
  warnings: QuoteWarning[];
  errors: QuoteError[];
  /**
   * Optional wallet-formatted display strings. Additive field:
   * producers that cannot format (no locale / counter-value fiat context)
   * omit it, and consumers must handle `undefined`.
   */
  formatted?: FormattedQuoteValues;
  /**
   * Provider-specific opaque blob forwarded verbatim to the swap-api DEX
   * endpoints (e.g. Uniswap spreads it into the swap body, Velora reads
   * `priceRoute` from it, OKX uses it whole). Consumers outside the DEX
   * builders should not interpret this field.
   */
  customFields?: Record<string, unknown>;
};

/**
 * Parameters for the new device-intent-based swap entry point
 * (`custom.swap`). Currently only the EVM token-approval step is wired on
 * the wallet side; the submit-swap and broadcast-swap steps will reuse the
 * same input shape as they come online.
 */
export type CustomSwapParams = {
  /** Quote selected by the live app (from `custom.exchange.getQuotes`). */
  quote: Quote;
  /** Wallet-API account id of the sending account. */
  fromAccountId: string;
  /** Wallet-API account id of the receiving account. */
  toAccountId: string;
  /** Provider name (e.g. `"uniswap"`). */
  provider: string;
};

/**
 * Result of `custom.swap`. Fields are additive: classic AMM swaps populate
 * `approvalTxHash` / `swapTxHash`; RFQ swaps additionally populate
 * `swapId`, `finalAmount`, and `rfqStatus` once the partner-submitted
 * order resolves.
 */
export type CustomSwapResult = {
  /** Hash of the broadcast-and-confirmed approval transaction, when one was needed. */
  approvalTxHash?: string;
  /** Hash of the broadcast-and-confirmed swap transaction, when the swap step ran. */
  swapTxHash?: string;
  /** Partner-side swap id returned by the RFQ submit/status endpoints. */
  swapId?: string;
  /** Final filled amount reported by the RFQ status endpoint, when available. */
  finalAmount?: string;
  /** Terminal RFQ status reported by the swap-api `/swap/status` endpoint. */
  rfqStatus?: "finished" | "refunded";
};

/** Error rows returned next to quotes (swap API error objects). */
export type QuoteProviderError = {
  code: string;
  type: TradeMethod;
  provider: string;
  message: string;
  parameter: { [key: string]: string };
};

/**
 * Digested global state attached to {@link GetQuotesResponse.errors}.
 * Discriminated by `code`; multiple variants can stack (e.g. `noQuotes`
 * alongside `amountTooLow`). Empty array means "nothing to surface".
 *
 * Producers live wallet-side; this is the contract consumers read.
 */
export enum QuotesErrorCodes {
  NO_QUOTES = "noQuotes",
  QUOTE_INPUT_RESOLUTION_FAILED = "quoteInputResolutionFailed",
  AMOUNT_TOO_LOW = "amountTooLow",
  AMOUNT_TOO_HIGH = "amountTooHigh",
}

export type QuotesError =
  | { code: QuotesErrorCodes.NO_QUOTES }
  | { code: QuotesErrorCodes.QUOTE_INPUT_RESOLUTION_FAILED }
  | { code: QuotesErrorCodes.AMOUNT_TOO_LOW; minAmount: string }
  | { code: QuotesErrorCodes.AMOUNT_TOO_HIGH; maxAmount: string };

export type GetQuotesResponse = {
  quotes: Quote[];
  /**
   * Per-provider rejection rows from the aggregator. Each row is one
   * provider declining to quote with a reason (e.g. `amount_off_limits`).
   * Pure pass-through of the aggregator response — the wallet does not
   * digest these into globals here, that lives in {@link errors}.
   */
  providerErrors: QuoteProviderError[];
  /**
   * Digested global state for the whole batch (e.g. `noQuotes` when no
   * successful quotes came back, `amountTooLow` / `amountTooHigh` when
   * every provider rejected on amount bounds). Empty array when there is
   * nothing to surface.
   */
  errors: QuotesError[];
};
