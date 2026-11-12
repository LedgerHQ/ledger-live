import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";

import type { RawQuoteError } from "./service/types";
import { ProviderErrorCodes, QuotesErrorCodes, type QuotesError } from "./types";

/**
 * Inputs the producer reads. `amountFrom` is the user-input atomic amount
 * (`args.data.amount` at the orchestrator) — kept as a string so we never
 * touch `Number.MAX_SAFE_INTEGER`-sized inputs through `parseFloat`.
 */
export type ComputeQuotesErrorsArgs = {
  successfulQuotesCount: number;
  providerErrors: ReadonlyArray<RawQuoteError>;
  amountFrom: string;
};

/**
 * Derive the digested global error list returned on
 * `GetQuotesResponse.errors`.
 *
 * - Produces nothing when there is at least one successful quote - the
 *   batch outcome only emits globals when every provider failed.
 * - Always emits `noQuotes` when no successful quotes came back.
 * - Inspects `providerErrors` for `amount_off_limits` rows and, when
 *   the user's `amountFrom` actually falls below or above a provider's
 *   advertised bound, emits a single `amountTooLow` / `amountTooHigh`
 *   carrying the relevant threshold:
 *     - `amountTooLow.minAmount` is the LOWEST `minAmount` reported across
 *       providers (most useful guidance: "at least this much").
 *     - `amountTooHigh.maxAmount` is the HIGHEST `maxAmount` reported
 *       across providers ("at most this much").
 *
 * Errors stack: when both bounds match the response, `noQuotes` plus
 * both bound entries are emitted.
 *
 * Rows whose threshold does not actually bracket `amountFrom` are
 * ignored.
 */
export function computeQuotesErrors(args: ComputeQuotesErrorsArgs): QuotesError[] {
  if (args.successfulQuotesCount > 0) {
    return [];
  }

  const errors: QuotesError[] = [{ code: QuotesErrorCodes.NO_QUOTES }];

  const amountFromBn = parseFiniteBigNumber(args.amountFrom);
  if (!amountFromBn) {
    return errors;
  }
  const amountOffLimits = args.providerErrors.filter(
    row => row.code === ProviderErrorCodes.AMOUNT_OFF_LIMITS,
  );

  const tooLowCandidates = amountOffLimits
    .flatMap(row => {
      const minAmount = row.parameter?.minAmount;
      const value = parseFiniteBigNumber(minAmount);
      return minAmount != null && value?.gte(amountFromBn) ? [{ minAmount, value }] : [];
    })
    .sort((a, b) => a.value.comparedTo(b.value) ?? 0);

  const lowest = tooLowCandidates[0];
  if (lowest) {
    errors.push({ code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: lowest.minAmount });
  }

  const tooHighCandidates = amountOffLimits
    .flatMap(row => {
      const maxAmount = row.parameter?.maxAmount;
      const value = parseFiniteBigNumber(maxAmount);
      return maxAmount != null && value?.lte(amountFromBn) ? [{ maxAmount, value }] : [];
    })
    .sort((a, b) => b.value.comparedTo(a.value) ?? 0);

  const highest = tooHighCandidates[0];
  if (highest) {
    errors.push({ code: QuotesErrorCodes.AMOUNT_TOO_HIGH, maxAmount: highest.maxAmount });
  }

  return errors;
}
