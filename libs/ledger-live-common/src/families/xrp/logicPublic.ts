import { BigNumber } from "bignumber.js";
import { getMaxTrustLimit } from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";

// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-xrp/logic-public";

/** Max, the trust limit an IOU opt-in prefills, in the token's base units */
export async function getMaxTrustLimitForToken(
  currencyId: string,
  issuer: string,
  currency: string,
): Promise<BigNumber> {
  const limit = await getMaxTrustLimit(buildContext(currencyId), issuer, currency);

  return new BigNumber(limit.toString());
}
