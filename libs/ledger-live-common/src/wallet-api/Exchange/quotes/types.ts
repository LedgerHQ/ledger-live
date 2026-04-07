/**
 * Shared domain enums for swap quotes (backend / catalog alignment).
 */
export type TradeMethod = "fixed" | "float";

export type ProviderTypes = "DEX" | "CEX";

/**
 * EIP-712 permit payload shape as returned in quote `customFields` (raw JSON).
 */
export type RawPermit2Domain = {
  name: string;
  chainId: number;
  verifyingContract: string;
};

export type RawPermit2Details = {
  token: string;
  amount: string;
  expiration: string;
  nonce: string;
};

export type RawPermit2Single = {
  details: RawPermit2Details;
  spender: string;
  sigDeadline: string;
};

export type RawPermit2Types = {
  EIP712Domain: { name: string; type: string }[];
  PermitSingle: { name: string; type: string }[];
  PermitDetails: { name: string; type: string }[];
};

/** Permit2 typed-data envelope as embedded in provider-specific quote payloads. */
export type RawPermit2Message = {
  values: RawPermit2Single;
  message: RawPermit2Single;
  domain: RawPermit2Domain;
  types: RawPermit2Types;
  primaryType: "PermitSingle";
};

export type RawQuoteSlippageInfo = {
  default: number;
  minSlippage?: number;
  maxSlippage?: number;
};

export type RawQuoteNetworkFees = {
  value?: number;
  currency: string;
  gasLimit?: string;
};

export type RawQuotePayoutNetworkFees = {
  value: number;
  currency: string;
};

export type RawQuoteTags = {
  isRegistrationRequired: boolean;
  isTokenApprovalRequired: boolean;
};

export type RawQuoteApprovalTransaction = {
  calldata: string;
  from: string;
  gasLimit: number;
  gasPrice: number;
  to: string;
  value: string;
};

export type RawTokenAllowanceData = {
  approvalTransaction?: RawQuoteApprovalTransaction;
  approvedAmount?: string;
  isApproved: boolean;
};

export type RawQuoteCustomFields = {
  permitData?: Partial<RawPermit2Message>;
  quote?: unknown;
  priceRoute?: unknown;
  "@type"?: string;
  quoteResponse?: {
    typedData: Partial<RawPermit2Message>;
    orderHash?: string;
  };
};

/**
 * Successful quote entry as returned by the quotes HTTP API (raw JSON).
 */
export type RawQuote = {
  amountFrom?: number;
  /** Opaque currency reference from the API (normalized in the app). */
  amountToId?: unknown;
  amountFromId?: unknown;
  feeCurrency?: unknown;
  amountTo: number;
  currencyTicker?: string;
  exchangeRate: number;
  provider: string;
  providerType: ProviderTypes;
  providerURL?: string;
  quoteId?: string;
  slippage: number;
  slippageInfo?: RawQuoteSlippageInfo;
  type: TradeMethod;
  networkFees: RawQuoteNetworkFees;
  payoutNetworkFees?: RawQuotePayoutNetworkFees;
  tags: RawQuoteTags;
  key: string;
  tokenAllowanceData?: RawTokenAllowanceData;
  customFields?: RawQuoteCustomFields;
  liquiditySource: "RFQ" | "AMM" | undefined;
  /** Provider-reported errors on an otherwise successful quote row (raw). */
  errors?: unknown[];
};

export type RawQuoteErrorParameter = {
  [key: string]: string;
};

export type RawQuoteError = {
  code: string;
  type: "float" | "fixed";
  provider: string;
  message: string;
  parameter: RawQuoteErrorParameter;
};

export type RawQuoteAPI = RawQuote | RawQuoteError;
export type RawQuoteAPIResponse = Array<RawQuoteAPI>;

export type QuotesInput = {
  amount: string;
  counterValueCurrency: string;
  uniswapOrderType: string;
  sendAccountId?: string;
  sendCurrencyId?: string;
  receiveCurrencyId?: string;
  sendAddress?: string;
  receiveAddress?: string;
  networkFeesCurrencyId?: string;
  slippage?: number;
};

export type GetQuotesArgs = {
  providers: string[];
  data: QuotesInput;
  headers?: Array<[string, string]>;
  signal?: AbortSignal;
};

/** JSON-RPC wire payload (no AbortSignal). */
export type GetQuotesWireArgs = Omit<GetQuotesArgs, "signal">;

export type Quote = {
  quotes: RawQuote[];
  errors: RawQuoteError[];
};
