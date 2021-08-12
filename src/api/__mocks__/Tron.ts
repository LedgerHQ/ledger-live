import BigNumber from "bignumber.js";

import type { SuperRepresentative } from "../../families/tron/types";
import superRepresentatives from "./superRepresentativesData";

export const getTronSuperRepresentatives = (): Promise<
  SuperRepresentative[]
> => {
  return Promise.resolve(<SuperRepresentative[]>superRepresentatives);
};

export const __NEXT_VOTING_DATE__ = new Date(0);

export const getNextVotingDate = (): Promise<Date> => {
  return Promise.resolve(__NEXT_VOTING_DATE__);
};

export const extractBandwidthInfo = (): Record<string, unknown> => ({
  freeUsed: new BigNumber(0),
  freeLimit: new BigNumber(0),
  gainedUsed: new BigNumber(0),
  gainedLimit: new BigNumber(0),
});
