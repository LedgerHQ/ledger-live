import type { ResolvedQuotesInput } from "../resolveQuotesInput";

export function makeQuotesInput(overrides: Partial<ResolvedQuotesInput> = {}): ResolvedQuotesInput {
  return {
    amount: "100000000",
    sendAccountId: "send-account",
    receiveAccountId: "receive-account",
    sendAddress: "0xfrom",
    receiveAddress: "0xto",
    sendCurrencyId: "bitcoin",
    receiveCurrencyId: "ethereum",
    ...overrides,
  };
}
