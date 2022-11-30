import network from "../../network";
import { log } from "@ledgerhq/logs";
import { EnvName, EnvValue } from "../../env";
import { makeLRUCache } from "../../cache";
import type { CosmosValidatorItem, CosmosRewardsState } from "./types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Crypto from "./crypto/crypto";

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
          votingPower: this.validatorVotingPower(validator.tokens, rewardState),
          commission,
          estimatedYearlyRewardsRate: this.validatorEstimatedRate(
            commission,
            rewardState
          ),
        };
      });
      return validators;
    },
    (_: CosmosRewardsState) => this._currency.id
  );

  getValidators = async (): Promise<CosmosValidatorItem[]> => {
    const rewardsState = await this._crypto.getRewardsState();
    // validators need the rewardsState ONLY to compute voting power as
    // percentage instead of raw uatoms amounts
    return await this.cacheValidators(rewardsState);
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
