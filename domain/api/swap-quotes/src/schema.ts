import { ProviderErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import { z } from "zod";

export const TradeMethodSchema = z.enum(["fixed", "float"]);

export const ProviderTypesSchema = z.enum(["DEX", "CEX"]);

export const RawPermit2DomainSchema = z.object({
  name: z.string(),
  chainId: z.number(),
  verifyingContract: z.string(),
});

export const RawPermit2DetailsSchema = z.object({
  token: z.string(),
  amount: z.string(),
  expiration: z.string(),
  nonce: z.string(),
});

export const RawPermit2SingleSchema = z.object({
  details: RawPermit2DetailsSchema,
  spender: z.string(),
  sigDeadline: z.string(),
});

const NamedTypeListSchema = z.array(z.object({ name: z.string(), type: z.string() }));

export const RawPermit2TypesSchema = z.object({
  EIP712Domain: NamedTypeListSchema,
  PermitSingle: NamedTypeListSchema,
  PermitDetails: NamedTypeListSchema,
});

export const RawPermit2MessageSchema = z.object({
  values: RawPermit2SingleSchema,
  message: RawPermit2SingleSchema,
  domain: RawPermit2DomainSchema,
  types: RawPermit2TypesSchema,
  primaryType: z.literal("PermitSingle"),
});

export const RawQuoteSlippageInfoSchema = z.object({
  default: z.number(),
  minSlippage: z.number().optional(),
  maxSlippage: z.number().optional(),
});

export const RawQuoteNetworkFeesSchema = z.object({
  value: z.number().optional(),
  currency: z.string(),
  gasLimit: z.string().optional(),
});

export const RawQuotePayoutNetworkFeesSchema = z.object({
  value: z.number(),
  currency: z.string(),
});

export const RawQuoteTagsSchema = z.object({
  isRegistrationRequired: z.boolean(),
  isTokenApprovalRequired: z.boolean(),
});

export const RawQuoteApprovalTransactionSchema = z.object({
  calldata: z.string(),
  from: z.string(),
  gasLimit: z.number(),
  gasPrice: z.number(),
  to: z.string(),
  value: z.string(),
});

export const RawTokenAllowanceDataSchema = z.object({
  approvalTransaction: RawQuoteApprovalTransactionSchema.optional(),
  approvedAmount: z.string().optional(),
  isApproved: z.boolean(),
});

export const RawQuoteCustomFieldsSchema = z.object({
  permitData: RawPermit2MessageSchema.partial().optional(),
  quote: z.unknown().optional(),
  priceRoute: z.unknown().optional(),
  "@type": z.string().optional(),
  quoteId: z.unknown().optional(),
  quoteResponse: z
    .object({
      typedData: RawPermit2MessageSchema.partial(),
      orderHash: z.string().optional(),
    })
    .optional(),
});

export const RawQuoteSchema = z.object({
  amountFrom: z.number().optional(),
  amountToId: z.unknown().optional(),
  amountFromId: z.unknown().optional(),
  feeCurrency: z.unknown().optional(),
  amountTo: z.number(),
  currencyTicker: z.string().optional(),
  exchangeRate: z.number(),
  provider: z.string(),
  providerType: ProviderTypesSchema,
  providerURL: z.string().optional(),
  quoteId: z.string().optional(),
  slippage: z.number(),
  slippageInfo: RawQuoteSlippageInfoSchema.optional(),
  type: TradeMethodSchema,
  networkFees: RawQuoteNetworkFeesSchema,
  payoutNetworkFees: RawQuotePayoutNetworkFeesSchema.optional(),
  tags: RawQuoteTagsSchema,
  key: z.string(),
  tokenAllowanceData: RawTokenAllowanceDataSchema.optional(),
  customFields: RawQuoteCustomFieldsSchema.optional(),
  // Optional at runtime: the aggregator omits it for some providers, and a
  // required key here would reject the whole row.
  liquiditySource: z.union([z.literal("RFQ"), z.literal("AMM")]).optional(),
  errors: z.array(z.unknown()).optional(),
});

export const RawQuoteErrorParameterSchema = z.record(z.string(), z.string());

export const RawQuoteErrorSchema = z.object({
  // The union keeps `ProviderErrorCodes` autocomplete while accepting any code
  // the aggregator adds.
  code: z.union([z.enum(ProviderErrorCodes), z.string()]),
  type: TradeMethodSchema,
  provider: z.string(),
  message: z.string(),
  parameter: RawQuoteErrorParameterSchema,
});

export const RawQuoteApiSchema = z.union([RawQuoteErrorSchema, RawQuoteSchema]);

export const RawQuoteApiResponseSchema = z.array(RawQuoteApiSchema);

export const FetchQuotesResultSchema = z.object({
  rawQuotes: z.array(RawQuoteSchema),
  providerErrors: z.array(RawQuoteErrorSchema),
});
