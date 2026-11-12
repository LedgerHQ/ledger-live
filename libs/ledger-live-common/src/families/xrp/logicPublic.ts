import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { MAX_TRUST_LIMIT } from "@ledgerhq/coin-xrp/logic-public";
import type { Account } from "@ledgerhq/types-live";

export * from "@ledgerhq/coin-xrp/logic-public";

/** The trust limit an IOU opt-in prefills, in the token's base units: the protocol maximum */
export function getMaxTrustLimitForToken(): BigNumber {
  return new BigNumber(MAX_TRUST_LIMIT.toString());
}

/** The removal of the token is pending while a pending `OPT_OUT` carries its asset pair */
export function isTokenRemovalPending(account: Account, token: TokenCurrency): boolean {
  const optOuts = account.pendingOperations.filter(({ type }) => type === "OPT_OUT");

  return optOuts.some(({ transactionRaw }) => {
    if (!transactionRaw) return false;

    const hasAssetPair = "assetReference" in transactionRaw && "assetOwner" in transactionRaw;
    if (!hasAssetPair) return false;

    const isSameReference = transactionRaw.assetReference === token.tokenIdentifier;
    const isSameOwner = transactionRaw.assetOwner === token.contractAddress;

    return isSameReference && isSameOwner;
  });
}
