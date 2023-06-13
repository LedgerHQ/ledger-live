import { BigNumber } from "bignumber.js";
export const upperModulo = (value: BigNumber, trackId: BigNumber, modulo: BigNumber): BigNumber => {
  const lower = modulo.times(value.div(modulo).integerValue());
  const lowerPlusTrack = lower.plus(trackId);
  if (value.lte(lowerPlusTrack)) return lowerPlusTrack;
  return lowerPlusTrack.plus(modulo);
};
