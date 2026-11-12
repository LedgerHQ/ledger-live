import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { MAX_TRUST_LIMIT, getIssuerFee } from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";

export * from "@ledgerhq/coin-xrp/logic-public";

/** The protocol maximum of a trust limit, in the token's base units */
export const MAX_TRUST_LIMIT_VALUE = new BigNumber(MAX_TRUST_LIMIT.toString());

/** Whether a trust limit, in the token's base units, is the protocol maximum */
export function isMaxTrustLimitValue(limit: BigNumber): boolean {
  return limit.eq(MAX_TRUST_LIMIT_VALUE);
}

/** The issuer's fee on each transfer between holders, as a percentage: "0.5" for 0.5% */
export function getIssuerFeeForToken(token: TokenCurrency): Promise<string> {
  return getIssuerFee(buildContext(token.parentCurrencyId), {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
  });
}
