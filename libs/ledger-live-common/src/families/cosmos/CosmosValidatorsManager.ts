import network from "../../network";
import { log } from "@ledgerhq/logs";
import { EnvName, EnvValue, getEnv } from "../../env";
import { makeLRUCache } from "../../cache";
import type { CosmosValidatorItem, CosmosRewardsState } from "./types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Utils
const getBaseApiUrl = (currency: CryptoCurrency) => {
  if (currency.id === "cosmos_testnet") {
    return getEnv("API_COSMOS_TESTNET_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
  } else {
    return getEnv("API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
  }
};

const isStargate = (currency: CryptoCurrency) => {
  if (currency.id === "cosmos_testnet") {
    return getEnv("API_COSMOS_TESTNET_NODE") == "STARGATE_NODE";
  } else {
    return getEnv("API_COSMOS_NODE") == "STARGATE_NODE";
  }
};

const parseUatomStrAsAtomNumber = (uatoms: string) => {
  return parseFloat(uatoms) / 1000000.0;
};

export class CosmosValidatorsManager {
  protected _namespace = "cosmos";
  protected _version = "v1beta1";
  protected _currency!: CryptoCurrency;
  protected _minDenom!: string;
  protected _endPoint: EnvValue<EnvName> | undefined;
  protected _rewardsState: any | undefined;

  constructor(
    currency: CryptoCurrency,
    options?: {
      namespace?: string;
      // version?: string;
      endPoint?: EnvValue<EnvName>;
      rewardsState?: any;
    }
  ) {
    this._currency = currency;
    this._endPoint = getBaseApiUrl(this._currency);
    this._minDenom = currency.id === "cosmos_testnet" ? "umuon" : "uatom";

    if (options?.namespace) {
      this._namespace = options.namespace;
    }
    // if (options?.version) {
    //   this._version = options.version;
    // }
    if (options?.endPoint) {
      this._endPoint = options.endPoint;
      // TODO this is a hack for now
      this._minDenom = currency.units[1].code; // this will be uosmo for Osmosis
    }

    if (options?.rewardsState) {
      this._rewardsState = options.rewardsState;
    }
  }

  private cacheValidators = makeLRUCache(
    async (rewardState: CosmosRewardsState): Promise<CosmosValidatorItem[]> => {
      const currency = this._currency;
      if (isStargate(currency)) {
        const url = `${this._endPoint}/cosmos/staking/${this._version}/validators?status=BOND_STATUS_BONDED&pagination.limit=175`;
        const { data } = await network({
          url,
          method: "GET",
        });
        const validators = data.validators.map((validator) => {
          const commission = parseFloat(
            validator.commission.commission_rates.rate
          );
          return {
            validatorAddress: validator.operator_address,
            name: validator.description.moniker,
            tokens: parseFloat(validator.tokens),
            votingPower: this.validatorVotingPower(
              validator.tokens,
              rewardState
            ),
            commission,
            estimatedYearlyRewardsRate: this.validatorEstimatedRate(
              commission,
              rewardState
            ),
          };
        });
        return validators;
      } else {
        const url = `${this._endPoint}/staking/validators`;
        const { data } = await network({
          url,
          method: "GET",
        });
        const validators = data.result.map((validator) => {
          const commission = parseFloat(
            validator.commission.commission_rates.rate
          );
          return {
            validatorAddress: validator.operator_address,
            name: validator.description.moniker,
            tokens: parseFloat(validator.tokens),
            votingPower: this.validatorVotingPower(
              validator.tokens,
              rewardState
            ),
            commission,
            estimatedYearlyRewardsRate: this.validatorEstimatedRate(
              commission,
              rewardState
            ),
          };
        });
        return validators;
      }
    },
    (_: CosmosRewardsState) => this._currency.id
  );

  getValidators = async (): Promise<CosmosValidatorItem[]> => {
    if (isStargate(this._currency)) {
      const rewardsState = this._rewardsState
        ? await this._rewardsState()
        : await this.getStargateRewardsState();

      // validators need the rewardsState ONLY to compute voting power as
      // percentage instead of raw uatoms amounts
      return await this.cacheValidators(rewardsState);
    } else {
      const rewardsState = await this.getRewardsState();
      // validators need the rewardsState ONLY to compute voting power as
      // percentage instead of raw uatoms amounts
      return await this.cacheValidators(rewardsState);
    }
  };

  private getRewardsState = makeLRUCache(
    async () => {
      // All obtained values are strings ; so sometimes we will need to parse them as numbers
      const inflationUrl = `${this._endPoint}/minting/inflation`;
      const { data: inflationData } = await network({
        url: inflationUrl,
        method: "GET",
      });
      const currentValueInflation = parseFloat(inflationData.result);
      const inflationParametersUrl = `${this._endPoint}/minting/parameters`;
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
      const communityTaxUrl = `${this._endPoint}/distribution/parameters`;
      const { data: communityTax } = await network({
        url: communityTaxUrl,
        method: "GET",
      });
      const communityPoolCommission = parseFloat(
        communityTax.result.community_tax
      );
      const supplyUrl = `${this._endPoint}/supply/total`;
      const { data: totalSupplyData } = await network({
        url: supplyUrl,
        method: "GET",
      });
      const totalSupply = parseUatomStrAsAtomNumber(
        totalSupplyData.result[0].amount
      );
      const ratioUrl = `${this._endPoint}/staking/pool`;
      const { data: ratioData } = await network({
        url: ratioUrl,
        method: "GET",
      });
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
    () => this._currency.id
  );

  private getStargateRewardsState = makeLRUCache(
    async () => {
      /*
      return {
        targetBondedRatio: 0.01,
        communityPoolCommission: 0.0,
        assumedTimePerBlock: 7,
        inflationRateChange: 0.01,
        inflationMaxRate: 0.01,
        inflationMinRate: 0.01,
        actualBondedRatio: 0.01,
        averageTimePerBlock: 7,
        totalSupply: 0,
        averageDailyFees: 0,
        currentValueInflation: 0.01,
      };
      */

      // All obtained values are strings ; so sometimes we will need to parse them as numbers
      const inflationUrl = `${this._endPoint}/cosmos/mint/v1beta1/inflation`;

      const { data: inflationData } = await network({
        url: inflationUrl,
        method: "GET",
      });

      const currentValueInflation = parseFloat(inflationData.inflation);

      const inflationParametersUrl = `${this._endPoint}/cosmos/mint/v1beta1/params`;

      const { data: inflationParametersData } = await network({
        url: inflationParametersUrl,
        method: "GET",
      });

      const inflationRateChange = parseFloat(
        inflationParametersData.params.inflation_rate_change
      );

      const inflationMaxRate = parseFloat(
        inflationParametersData.params.inflation_max
      );

      const inflationMinRate = parseFloat(
        inflationParametersData.params.inflation_min
      );

      const targetBondedRatio = parseFloat(
        inflationParametersData.params.goal_bonded
      );

      // Source for seconds per year : https://github.com/gavinly/CosmosParametersWiki/blob/master/Mint.md#notes-3
      //  365.24 (days) * 24 (hours) * 60 (minutes) * 60 (seconds) = 31556736 seconds
      const assumedTimePerBlock =
        31556736.0 / parseFloat(inflationParametersData.params.blocks_per_year);

      const communityTaxUrl = `${this._endPoint}/cosmos/distribution/v1beta1/params`;

      const { data: communityTax } = await network({
        url: communityTaxUrl,
        method: "GET",
      });

      const communityPoolCommission = parseFloat(
        communityTax.params.community_tax
      );

      const supplyUrl = `${this._endPoint}/cosmos/bank/v1beta1/supply/${this._minDenom}`;

      const { data: totalSupplyData } = await network({
        url: supplyUrl,
        method: "GET",
      });

      const totalSupply = parseUatomStrAsAtomNumber(
        totalSupplyData.amount.amount
      );

      const ratioUrl = `${this._endPoint}/cosmos/staking/v1beta1/pool`;

      const { data: ratioData } = await network({
        url: ratioUrl,
        method: "GET",
      });

      const actualBondedRatio =
        parseUatomStrAsAtomNumber(ratioData.pool.bonded_tokens) / totalSupply;

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
    () => this._currency.id
  );

  private computeAvgYearlyInflation = (rewardsState: CosmosRewardsState) => {
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
        (rewardsState.currentValueInflation + unrestrictedEndOfYearInflation) /
        2
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

  validatorVotingPower = (
    validatorTokens: string,
    rewardsState: CosmosRewardsState
  ): number => {
    return (
      parseFloat(validatorTokens) /
      (rewardsState.actualBondedRatio * rewardsState.totalSupply * 1000000) // TODO validate that this is correct for Osmosis. Just because we get a valid number doesn't mean it's correct
    );
  };

  _osmoValidatorEstimatedRate = (_: number, __: CosmosRewardsState): number => {
    return 0.15; // todo fix this obviously
  };

  validatorEstimatedRate = (
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number => {
    if (this._namespace === "osmosis") {
      return this._osmoValidatorEstimatedRate(
        validatorCommission,
        rewardsState
      );
    }

    // This correction changes how inflation is computed vs. the value the network advertises
    const inexactBlockTimeCorrection =
      rewardsState.assumedTimePerBlock / rewardsState.averageTimePerBlock;
    // This correction assumes a constant bonded_ratio, this changes the yearly inflation
    const yearlyInflation = this.computeAvgYearlyInflation(rewardsState);
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

  hydrateValidators = (validators: CosmosValidatorItem[]): void => {
    log(
      `${this._namespace}/validators`,
      "hydrate " + validators.length + " validators"
    );
    this.cacheValidators.hydrate("", validators);
  };
}
