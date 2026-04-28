import type { QuoteTags } from "../types";
import type { RawQuote } from "../service/types";

/**
 * Map the raw `tags` object onto the wallet schema.
 *
 * The shape is identical today (`isRegistrationRequired`,
 * `isTokenApprovalRequired`) and the raw field is always populated, so this
 * helper is effectively a rebind: it exists for symmetry with the other
 * per-field normalizers and so future additions to `QuoteTags` have a
 * well-defined seam to land in.
 */
export function buildTags(quote: RawQuote): QuoteTags {
  return {
    isRegistrationRequired: quote.tags.isRegistrationRequired,
    isTokenApprovalRequired: quote.tags.isTokenApprovalRequired,
  };
}
