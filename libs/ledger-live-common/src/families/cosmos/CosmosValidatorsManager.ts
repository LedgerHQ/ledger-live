import network from "../../network";
import { log } from "@ledgerhq/logs";
import { EnvName, EnvValue, getEnv } from "../../env";
import { makeLRUCache } from "../../cache";
import type { CosmosValidatorItem, CosmosRewardsState } from "./types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Crypto from "./crypto/crypto";
import { parseUatomStrAsAtomNumber } from "./logic";

const isStargate = (currency: CryptoCurrency) => {
  if (currency.id === "cosmos_testnet") {
    return getEnv("API_COSMOS_TESTNET_NODE") == "STARGATE_NODE";
  } else {
    return getEnv("API_COSMOS_NODE") == "STARGATE_NODE";
  }
};

export class CosmosValidatorsManager {
  protected _version: string;
  protected _currency!: CryptoCurrency;
  protected _minDenom!: string;
  protected _endPoint: EnvValue<EnvName> | undefined;
  protected _rewardsState: any | undefined;
  private _crypto: Crypto;

  constructor(
    currency: CryptoCurrency,
    options?: {
      namespace?: string;
      endPoint?: EnvValue<EnvName>;
      rewardsState?: any;
    }
  ) {
    this._currency = currency;
    this._crypto = new Crypto(currency.id);
    this._endPoint = this._crypto.lcd;
    this._version = this._crypto.version;
    this._minDenom = currency.units[1].code;

    if (options?.endPoint) {
      this._endPoint = options.endPoint;
      this._minDenom = currency.units[1].code;
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
      const rewardsState = await this._crypto.getRewardsState();
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

  validatorVotingPower = (
    validatorTokens: string,
    rewardsState: CosmosRewardsState
  ): number => {
    return (
      parseFloat(validatorTokens) /
      (rewardsState.actualBondedRatio * rewardsState.totalSupply * 1000000) // TODO validate that this is correct for Osmosis. Just because we get a valid number doesn't mean it's correct
    );
  };

  validatorEstimatedRate = (
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number => {
    return this._crypto.validatorEstimatedRate(
      validatorCommission,
      rewardsState
    );
  };

  hydrateValidators = (validators: CosmosValidatorItem[]): void => {
    log(
      `${this._currency.id}/validators`,
      "hydrate " + validators.length + " validators"
    );
    this.cacheValidators.hydrate("", validators);
  };
}
