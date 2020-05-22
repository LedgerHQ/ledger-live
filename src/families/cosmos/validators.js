// @flow
import network from "../../network";
import { log } from "@ledgerhq/logs";
import { getEnv } from "../../env";
import { makeLRUCache } from "../../cache";

import type { CosmosValidatorItem, CosmosRewardsState } from "./types";

const getBaseApiUrl = () =>
  getEnv("API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT");

const cacheValidators = makeLRUCache(
  async (rewardState: CosmosRewardsState) => {
    const url = `${getBaseApiUrl()}/staking/validators`;
    const { data } = await network({ url, method: "GET" });

    const validators = data.result.map((validator) => {
      const commission = parseFloat(validator.commission.commission_rates.rate);
      return {
        validatorAddress: validator.operator_address,
        name: validator.description.moniker,
        votingPower:
          parseFloat(validator.tokens) /
          (rewardState.actualBondedRatio * rewardState.totalSupply * 1000000),
        commission,
        estimatedYearlyRewardsRate: validatorEstimatedRate(
          commission,
          rewardState
        ),
      };
    });

    return validators;
  },
  () => ""
);

export const getValidators = async () => {
  const rewardsState = await getRewardsState();
  // validators need the rewardsState ONLY to compute voting power as percentage instead of raw uatoms amounts
  return await cacheValidators(rewardsState);
};

const parseUatomStrAsAtomNumber = (uatoms: string) => {
  return parseFloat(uatoms) / 1000000.0;
};

const getRewardsState = makeLRUCache(
  async () => {
    // All obtained values are strings ; so sometimes we will need to parse them as numbers
    const inflationUrl = `${getBaseApiUrl()}/minting/inflation`;
    const { data: inflationData } = await network({
      url: inflationUrl,
      method: "GET",
    });
    const currentValueInflation = parseFloat(inflationData.result);

    const inflationParametersUrl = `${getBaseApiUrl()}/minting/parameters`;
    const { data: inflationParametersData } = await network({
      url: inflationParametersUrl,
      method: "GET",
    });
    const inflationRateChange = parseFloat(
      inflationParametersData.result.inflation_rate_change
    );
    const inflationMaxRate = parseFloat(
      inflationParametersData.result.inflation_max
    );
    const inflationMinRate = parseFloat(
      inflationParametersData.result.inflation_min
    );
    const targetBondedRatio = parseFloat(
      inflationParametersData.result.goal_bonded
    );
    // Source for seconds per year : https://github.com/gavinly/CosmosParametersWiki/blob/master/Mint.md#notes-3
    //  365.24 (days) * 24 (hours) * 60 (minutes) * 60 (seconds) = 31556736 seconds
    const assumedTimePerBlock =
      31556736.0 / parseFloat(inflationParametersData.result.blocks_per_year);

    const communityTaxUrl = `${getBaseApiUrl()}/distribution/parameters`;
    const { data: communityTax } = await network({
      url: communityTaxUrl,
      method: "GET",
    });
    const communityPoolCommission = parseFloat(
      communityTax.result.community_tax
    );

    const supplyUrl = `${getBaseApiUrl()}/supply/total`;
    const { data: totalSupplyData } = await network({
      url: supplyUrl,
      method: "GET",
    });
    const totalSupply = parseUatomStrAsAtomNumber(
      totalSupplyData.result[0].amount
    );

    const ratioUrl = `${getBaseApiUrl()}/staking/pool`;
    const { data: ratioData } = await network({ url: ratioUrl, method: "GET" });
    const actualBondedRatio =
      parseUatomStrAsAtomNumber(ratioData.result.bonded_tokens) / totalSupply;

    // Arbitrary value in ATOM.
    const averageDailyFees = 20;

    // Arbitrary value in seconds
    const averageTimePerBlock = 7.5;

    return {
      targetBondedRatio,
      communityPoolCommission,
      assumedTimePerBlock,
      inflationRateChange,
      inflationMaxRate,
      inflationMinRate,
      actualBondedRatio,
      averageTimePerBlock,
      totalSupply,
      averageDailyFees,
      currentValueInflation,
    };
  },
  () => ""
);

const computeAvgYearlyInflation = (rewardsState: CosmosRewardsState) => {
  // Return invalid rewardsState if
  // rewardsState.currentValueInflation is not between inflationMinRate and inflationMaxRate
  const inflationSlope =
    (1 - rewardsState.actualBondedRatio / rewardsState.targetBondedRatio) *
    rewardsState.inflationRateChange;
  const unrestrictedEndOfYearInflation =
    rewardsState.currentValueInflation * (1 + inflationSlope);

  if (
    unrestrictedEndOfYearInflation <= rewardsState.inflationMaxRate &&
    unrestrictedEndOfYearInflation >= rewardsState.inflationMinRate
  ) {
    return (
      (rewardsState.currentValueInflation + unrestrictedEndOfYearInflation) / 2
    );
  }

  if (unrestrictedEndOfYearInflation > rewardsState.inflationMaxRate) {
    const diffToMax =
      rewardsState.inflationMaxRate - rewardsState.currentValueInflation;
    const maxPoint = diffToMax / inflationSlope;
    const averageInflation =
      (1 - maxPoint / 2) * rewardsState.inflationMaxRate +
      (maxPoint / 2) * rewardsState.currentValueInflation;
    return averageInflation;
  }

  if (unrestrictedEndOfYearInflation < rewardsState.inflationMinRate) {
    const diffToMin =
      rewardsState.currentValueInflation - rewardsState.inflationMinRate;
    const minPoint = diffToMin / inflationSlope;
    const averageInflation =
      (1 - minPoint / 2) * rewardsState.inflationMinRate +
      (minPoint / 2) * rewardsState.currentValueInflation;
    return averageInflation;
  }

  throw new Error("Unreachable code");
};

export const validatorEstimatedRate = (
  validatorCommission: number,
  rewardsState: CosmosRewardsState
) => {
  // This correction changes how inflation is computed vs. the value the network advertises
  const inexactBlockTimeCorrection =
    rewardsState.assumedTimePerBlock / rewardsState.averageTimePerBlock;
  // This correction assumes a constant bonded_ratio, this changes the yearly inflation
  const yearlyInflation = computeAvgYearlyInflation(rewardsState);

  // This correction adds the fees to the rate computation
  const yearlyFeeRate =
    (rewardsState.averageDailyFees * 365.24) / rewardsState.totalSupply;

  return (
    inexactBlockTimeCorrection *
    (yearlyInflation + yearlyFeeRate) *
    (1 / rewardsState.actualBondedRatio) *
    (1 - rewardsState.communityPoolCommission) *
    (1 - validatorCommission)
  );
};

export const hydrateValidators = (validators: CosmosValidatorItem[]) => {
  log("cosmos/validators", "hydrate " + validators.length + " validators");
  cacheValidators.hydrate("", validators);
};
