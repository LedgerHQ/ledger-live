import type { QuotePermit2Message, QuotePermitData } from "../types";
import type { RawQuote } from "../service/types";

/**
 * Fold the raw `customFields` permit-related bag into the wallet-side
 * `QuotePermitData` envelope.
 *
 * Provider representation on `customFields`:
 * - `customFields.permitData`                    → UniswapX EIP-712 typed-data
 * - `customFields.quoteResponse.typedData`       → 1inch-fusion typed-data
 * - `customFields.quoteResponse.orderHash`       → 1inch-fusion order hash
 * - `customFields.priceRoute`                    → Velora execution payload
 * - `customFields["@type"]`                      → provider tag
 *
 * Wallet target: a single optional object grouping these siblings under
 * stable names so consumers don't have to know about the raw `customFields`
 * layout. The UniswapX `permitData` source wins when both it and
 * `quoteResponse.typedData` are present.
 *
 * Returns `undefined` when all four sources are absent so the output field
 * stays unset on non-permit rows (CEX, classic oneinch, lifi).
 */
export function buildPermitData(quote: RawQuote): QuotePermitData | undefined {
  const custom = quote.customFields;
  if (custom === undefined) {
    return undefined;
  }

  // `Partial<RawPermit2Message>` is structurally equivalent to
  // `QuotePermit2Message` (both make every branch optional), so the handoff
  // is a type-safe assignment rather than a field-by-field remap. The
  // nested typed-data payload is opaque to this layer: it is passed to the
  // device for signing in the shape the provider produced it.
  const typedData: QuotePermit2Message | undefined =
    custom.permitData ?? custom.quoteResponse?.typedData;
  const orderHash = custom.quoteResponse?.orderHash;
  const priceRoute = custom.priceRoute;
  const providerTag = custom["@type"];

  if (
    typedData === undefined &&
    orderHash === undefined &&
    priceRoute === undefined &&
    providerTag === undefined
  ) {
    return undefined;
  }

  const result: QuotePermitData = {};
  if (typedData !== undefined) {
    result.typedData = typedData;
  }
  if (orderHash !== undefined) {
    result.orderHash = orderHash;
  }
  if (priceRoute !== undefined) {
    result.priceRoute = priceRoute;
  }
  if (providerTag !== undefined) {
    result.providerTag = providerTag;
  }
  return result;
}
