import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/types";
import { getTronSuperRepresentatives } from "../network";
import type { SuperRepresentative } from "../types";
import { ONE_TRX } from "./constants";

/**
 * Tron's super representatives, as framework {@link Validator}s.
 *
 * The witness list is a single bounded response (27 active SRs plus candidates) that the network
 * layer already LRU-caches for an hour, so there is nothing to paginate: the whole list is returned
 * and `next` is always absent. A supplied cursor is therefore meaningless and rejected rather than
 * silently ignored, which would loop a paginating caller forever.
 *
 * `commissionRate` and `apy` are deliberately left unset: `/wallet/listwitnesses` carries neither
 * (only vote counts and block-production stats), the brokerage rate would cost one extra request per
 * SR, and no APY is published at all. A UI must therefore not present either for Tron — live-common
 * coerces the absent values to 0, which would read as "0% commission, 0% yield".
 */
export async function getValidators(cursor?: Cursor): Promise<Page<Validator>> {
  if (cursor !== undefined) {
    throw new Error("getValidators does not paginate for Tron: the witness list is returned whole");
  }

  const superRepresentatives = await getTronSuperRepresentatives();
  return { items: superRepresentatives.map(toValidator) };
}

function toValidator(sr: SuperRepresentative): Validator {
  return {
    // Tron SRs carry no separate identifier, so the framework's documented fallback applies: use the address.
    id: sr.address,
    address: sr.address,
    name: displayName(sr),
    ...(sr.url ? { url: sr.url } : {}),
    // 1 vote is backed by 1 TRX of staked Tron Power, so the vote count is the pool size in sun.
    balance: BigInt(ONE_TRX.multipliedBy(sr.voteCount).toFixed(0)),
  };
}

// `/wallet/listwitnesses` carries no display name — only the SR's declared website. Deriving the
// label from its host keeps this a single cached request; resolving real on-chain account names
// would cost one `accountNamesCache` fetch per SR, which no current consumer needs.
function displayName(sr: SuperRepresentative): string {
  if (!sr.url) return sr.address;
  try {
    return new URL(sr.url).hostname || sr.address;
  } catch {
    return sr.url;
  }
}
