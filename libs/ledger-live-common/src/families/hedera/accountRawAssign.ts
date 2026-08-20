import {
  assignFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-hedera/bridge/serialization";

/**
 * Persists `hederaResources` (maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled,
 * delegation) through the `fromAccountRaw` / `toAccountRaw` cycle — the default
 * generic-coin-framework pipeline does not serialize family-specific account resources.
 *
 * Mirrors `families/tezos/accountRawAssign.ts`, keeping
 * `generic-coin-framework/accountRawAssign.ts` family-agnostic.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
