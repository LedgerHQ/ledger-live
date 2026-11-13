import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import {
  MAX_TRUST_LIMIT as MAX_TRUST_LIMIT_BIGINT,
  getIssuerFee,
} from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";

export * from "@ledgerhq/coin-xrp/logic-public";

// These BigNumber versions take precedence over the bigint ones of the `export *` above

/** The protocol maximum of a trust limit, in the token's base units */
export const MAX_TRUST_LIMIT = new BigNumber(MAX_TRUST_LIMIT_BIGINT.toString());

/** Whether a trust limit, in the token's base units, is the protocol maximum */
export function isMaxTrustLimit(limit: BigNumber): boolean {
  return limit.eq(MAX_TRUST_LIMIT);
}

/** The issuer's fee on each transfer between holders, as a percentage: "0.5" for 0.5% */
export function getIssuerFeeForToken(token: TokenCurrency): Promise<string> {
  return getIssuerFee(buildContext(token.parentCurrencyId), {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
  });
}
