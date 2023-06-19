import BigNumber from "bignumber.js";

export function motesToCSPR(motes: number | string): BigNumber {
  if (!motes) return new BigNumber(0);

  return new BigNumber(motes).div(1000000000);
}

export function csprToMotes(cspr: number | string): BigNumber {
  if (!cspr) return new BigNumber(0);
  return new BigNumber(cspr).multipliedBy(1000000000);
}
