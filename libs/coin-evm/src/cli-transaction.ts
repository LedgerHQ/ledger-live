import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { LRUCacheFn } from "@ledgerhq/coin-framework/cache";

// Needed by sync-families-dispatch script
// libs/ledger-live-common/scripts/sync-families-dispatch.mjs
export default function makeCliTools(_network: NetworkRequestCall, _cache: LRUCacheFn) {
  return {};
}
