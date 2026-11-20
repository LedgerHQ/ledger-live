import { scrubAccountId } from "~/renderer/helpers/scrubAccountId";

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
