import BigNumber from "bignumber.js";
import { MAX_TRUST_LIMIT } from "@ledgerhq/coin-xrp/logic-public";

export * from "@ledgerhq/coin-xrp/logic-public";

/** The trust limit an IOU opt-in prefills, in the token's base units: the protocol maximum */
export function getMaxTrustLimitForToken(): BigNumber {
  return new BigNumber(MAX_TRUST_LIMIT.toString());
}
