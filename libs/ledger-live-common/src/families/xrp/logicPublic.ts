import { BigNumber } from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getDefaultTrustLimit } from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";

export * from "@ledgerhq/coin-xrp/logic-public";

/** The trust limit an IOU opt-in prefills, in the token's base units. coin-xrp throws on an MPT. */
export async function getMaxTrustLimitForToken(token: TokenCurrency): Promise<BigNumber> {
  const asset = {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
  };
  const limit = await getDefaultTrustLimit(buildContext(token.parentCurrencyId), asset);

  return new BigNumber(limit.toString());
}
