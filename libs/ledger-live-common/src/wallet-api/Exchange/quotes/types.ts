/**
 * Public Wallet API types for `getQuotes` (from `@ledgerhq/wallet-api-exchange-module`).
 * Raw HTTP shapes live in `service/types.ts` and are not re-exported here.
 */
export type {
  QuotesInput,
  QuotesAppPlatform,
  QuoteSortBy,
  QuotesVersionCompatibility,
  GetQuotesArgs,
  GetQuotesWireArgs,
  GetQuotesResponse,
  Quote,
  QuoteDetails,
  QuoteNetworkFees,
  QuoteWarning,
  QuoteError,
  QuotesError,
  ProviderDetails,
  QuoteProviderError,
  QuoteLiquiditySource,
  QuotePayoutNetworkFees,
  QuotePermit2Message,
  QuotePermitData,
  QuoteTags,
  QuoteTokenAllowance,
  QuoteEstimatedNetworkFee,
  QuoteApprovalNetworkFee,
} from "@ledgerhq/wallet-api-exchange-module";

export {
  ProviderErrorCodes,
  QuoteErrorCodes,
  QuoteWarningCodes,
  QuotesErrorCodes,
} from "@ledgerhq/wallet-api-exchange-module";
