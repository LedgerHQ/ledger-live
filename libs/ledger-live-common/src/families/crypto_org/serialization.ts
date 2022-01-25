import { BigNumber } from "bignumber.js";
import type { CryptoOrgResourcesRaw, CryptoOrgResources } from "./types";
export function toCryptoOrgResourcesRaw(
  r: CryptoOrgResources
): CryptoOrgResourcesRaw {
  const { bondedBalance, redelegatingBalance, unbondingBalance, commissions } =
    r;
  return {
    bondedBalance: bondedBalance.toString(),
    redelegatingBalance: redelegatingBalance.toString(),
    unbondingBalance: unbondingBalance.toString(),
    commissions: commissions.toString(),
  };
}
export function fromCryptoOrgResourcesRaw(
  r: CryptoOrgResourcesRaw
): CryptoOrgResources {
  const { bondedBalance, redelegatingBalance, unbondingBalance, commissions } =
    r;
  return {
    bondedBalance: new BigNumber(bondedBalance),
    redelegatingBalance: new BigNumber(redelegatingBalance),
    unbondingBalance: new BigNumber(unbondingBalance),
    commissions: new BigNumber(commissions),
  };
}
