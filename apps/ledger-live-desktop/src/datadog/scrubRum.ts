import { scrubAccountId } from "~/renderer/helpers/scrubAccountId";

/**
 * Redacts the segment following `/address/` or `/addresses/` in a URL pathname.
 * Ledger coin module APIs embed the wallet address at this path position,
 * e.g. `.../blockchain/v4/eth/address/0xeF…/txs` or `.../addresses/${addr}/balance`.
 */
function scrubAddressPathSegment(pathname: string): string {
  return pathname.replace(/(\/address(?:es)?\/)([^/]+)/gi, "$1[redacted]");
}

/**
 * Redacts the segment following `/reverse-resolve/` in a URL pathname.
 * ENS lookup endpoints use this path shape: `.../ens/reverse-resolve/0xeF…`
 */
function scrubReverseResolveSegment(pathname: string): string {
  return pathname.replace(/(\/reverse-resolve\/)([^/]+)/gi, "$1[redacted]");
}

/**
 * Scrubs account IDs from URL query parameters.
 * Some Ledger API requests pass the full account ID URL-encoded in a query param,
 * e.g. `?id=js%3A2%3Abitcoin%3Axpub6…%3Anative_segwit`. Each value is decoded
 * and passed through `scrubAccountId` before being re-encoded.
 */
function scrubQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const scrubbed = new URLSearchParams();
  for (const [key, value] of searchParams) {
    scrubbed.set(key, scrubAccountId(value));
  }
  return scrubbed;
}

/**
 * Scrubs wallet addresses from Datadog RUM resource.url.
 *
 * Three confirmed leak patterns in Ledger API request URLs:
 * - `/address/{address}/…` — coin module path (all chains)
 * - `/reverse-resolve/{address}` — ENS lookup endpoint
 * - `?{key}=js%3A2%3A…` — full account ID URL-encoded in a query param
 */
export function scrubResourceUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  parsed.pathname = scrubReverseResolveSegment(scrubAddressPathSegment(parsed.pathname));
  parsed.search = scrubQueryParams(parsed.searchParams).toString();
  return parsed.toString();
}

/**
 * Scrubs wallet addresses from Datadog RUM view.url_hash.
 *
 * The hash fragment holds the React Router route, which on account pages is
 * /account/js:2:{chain}:{address}:{derivation} — the full account ID.
 * Present on every event type (view, action, resource, error).
 */
export function scrubViewUrlHash(hash: string): string {
  return scrubAccountId(hash);
}

/**
 * Scrubs wallet addresses from Datadog RUM action.target.name.
 *
 * The Browser SDK captures the visible text of clicked elements; account data
 * serialized as JSON produces strings like: {"xpub":"xpub6C8aARQ2…","index":0,…}
 * The "xpub" key holds the address for all chain types (EVM stores the 0x address there).
 */
export function scrubActionTargetName(name: string): string {
  return name.replace(/"xpub"\s*:\s*"[^"]*"/g, '"xpub": "[redacted]"');
}
