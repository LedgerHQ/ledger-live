import type { z } from "zod";

import type {
  FetchQuotesResultSchema,
  ProviderTypesSchema,
  RawPermit2DetailsSchema,
  RawPermit2DomainSchema,
  RawPermit2MessageSchema,
  RawPermit2SingleSchema,
  RawPermit2TypesSchema,
  RawQuoteApiResponseSchema,
  RawQuoteApiSchema,
  RawQuoteApprovalTransactionSchema,
  RawQuoteCustomFieldsSchema,
  RawQuoteErrorParameterSchema,
  RawQuoteErrorSchema,
  RawQuoteNetworkFeesSchema,
  RawQuotePayoutNetworkFeesSchema,
  RawQuoteSchema,
  RawQuoteSlippageInfoSchema,
  ResolvedQuotesInputSchema,
  RawQuoteTagsSchema,
  SwapQuotesApiExtraSchema,
  RawTokenAllowanceDataSchema,
  TradeMethodSchema,
  UniswapOrderTypeSchema,
} from "./schema";

export type TradeMethod = z.infer<typeof TradeMethodSchema>;
export type ProviderTypes = z.infer<typeof ProviderTypesSchema>;
export type RawPermit2Domain = z.infer<typeof RawPermit2DomainSchema>;
export type RawPermit2Details = z.infer<typeof RawPermit2DetailsSchema>;
export type RawPermit2Single = z.infer<typeof RawPermit2SingleSchema>;
export type RawPermit2Types = z.infer<typeof RawPermit2TypesSchema>;
export type RawPermit2Message = z.infer<typeof RawPermit2MessageSchema>;
export type RawQuoteSlippageInfo = z.infer<typeof RawQuoteSlippageInfoSchema>;
export type RawQuoteNetworkFees = z.infer<typeof RawQuoteNetworkFeesSchema>;
export type RawQuotePayoutNetworkFees = z.infer<typeof RawQuotePayoutNetworkFeesSchema>;
export type RawQuoteTags = z.infer<typeof RawQuoteTagsSchema>;
export type RawQuoteApprovalTransaction = z.infer<typeof RawQuoteApprovalTransactionSchema>;
export type RawTokenAllowanceData = z.infer<typeof RawTokenAllowanceDataSchema>;
export type RawQuoteCustomFields = z.infer<typeof RawQuoteCustomFieldsSchema>;
export type RawQuote = z.infer<typeof RawQuoteSchema>;
export type RawQuoteErrorParameter = z.infer<typeof RawQuoteErrorParameterSchema>;
export type RawQuoteError = z.infer<typeof RawQuoteErrorSchema>;
export type RawQuoteAPI = z.infer<typeof RawQuoteApiSchema>;
export type RawQuoteAPIResponse = z.infer<typeof RawQuoteApiResponseSchema>;
export type FetchQuotesResult = z.infer<typeof FetchQuotesResultSchema>;

export type SwapQuotesApiExtra = z.infer<typeof SwapQuotesApiExtraSchema>;
export type UniswapOrderType = z.infer<typeof UniswapOrderTypeSchema>;
export type ResolvedQuotesInput = z.infer<typeof ResolvedQuotesInputSchema>;

export type FetchQuotesQueryArgs = {
  providers: string[];
  quotesInput: ResolvedQuotesInput;
  counterValueCurrency: string;
  customHeaders?: Record<string, string>;
};
