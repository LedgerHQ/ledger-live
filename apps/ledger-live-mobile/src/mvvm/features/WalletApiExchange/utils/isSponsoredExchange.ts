import type { ExchangeSessionCompleteRequest } from "../session";

type SponsorshipParams = Pick<
  ExchangeSessionCompleteRequest["exchangeParams"],
  "sponsored" | "transaction"
>;

/** `custom.exchange.complete` has no top-level hint: only the EVM transaction says it. */
export function isSponsoredExchange({
  sponsored,
  transaction,
}: SponsorshipParams): boolean | undefined {
  if (sponsored !== undefined) return sponsored;
  return transaction.family === "evm" ? transaction.sponsored : undefined;
}
