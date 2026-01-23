import BigNumber from "bignumber.js";

// TODO: better mock
export async function estimateFees(): Promise<BigNumber> {
  return new BigNumber(30_000);
}
