import { RawQuoteErrorSchema, RawQuoteSchema } from "../schema";
import type { RawQuote, RawQuoteError } from "../types";

/** Parsed through the schema, so a fixture cannot drift from the contract. */
export function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return RawQuoteSchema.parse({
    provider: "lifi",
    providerType: "DEX",
    amountFrom: 1,
    amountTo: 0.999,
    exchangeRate: 0.999,
    slippage: 1,
    type: "float",
    networkFees: { currency: "ethereum" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: "lifi-key",
    liquiditySource: "AMM",
    ...overrides,
  });
}

export function makeRawQuoteError(overrides: Partial<RawQuoteError> = {}): RawQuoteError {
  return RawQuoteErrorSchema.parse({
    code: "amount_off_limits",
    type: "float",
    provider: "okx",
    message: "amount out of range",
    parameter: { minAmount: "200000000" },
    ...overrides,
  });
}
