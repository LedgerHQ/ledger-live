// @flow

import type { CosmosPreloadData } from "./types";

// TODO fill up a valid mock static version of it
const data: CosmosPreloadData = {
  validators: [],
  rewardsState: {
    targetBondedRatio: 0,
    communityPoolCommission: 0,
    assumedTimePerBlock: 0,
    inflationRateChange: 0,
    inflationMaxRate: 0,
    inflationMinRate: 0,
    actualBondedRatio: 0,
    averageTimePerBlock: 0,
    totalSupply: 0,
    averageDailyFees: 0,
    currentValueInflation: 0
  }
};

export default data;
