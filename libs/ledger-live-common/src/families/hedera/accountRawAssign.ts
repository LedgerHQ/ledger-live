import {
  assignFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-hedera/bridge/serialization";

/** The generic-coin-framework pipeline does not serialize family-specific account resources. */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
