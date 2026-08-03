import { ProviderErrorCodes } from "@ledgerhq/wallet-api-exchange-module";

import type { RawQuote, RawQuoteError } from "./types";

export function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
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
  };
}

export function makeRawQuoteError(overrides: Partial<RawQuoteError> = {}): RawQuoteError {
  return {
    code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
    type: "float",
    provider: "okx",
    message: "amount out of range",
    parameter: { minAmount: "200000000" },
    ...overrides,
  };
}
