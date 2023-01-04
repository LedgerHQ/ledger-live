import network from "../../network";
import { log } from "@ledgerhq/logs";
import { EnvName, EnvValue } from "../../env";
import { makeLRUCache } from "../../cache";
import type { CosmosValidatorItem } from "./types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import cryptoFactory from "./chain/chain";
import cosmosBase from "./chain/cosmosBase";

export class CosmosValidatorsManager {
  protected _version: string;
  protected _currency!: CryptoCurrency;
  protected _minDenom!: string;
  protected _endPoint: EnvValue<EnvName> | undefined;
  protected _rewardsState: any | undefined;
  private _crypto: cosmosBase;

  constructor(
    currency: CryptoCurrency,
    options?: {
      namespace?: string;
      endPoint?: EnvValue<EnvName>;
      rewardsState?: any;
    }
  ) {
    this._currency = currency;
    this._crypto = cryptoFactory(currency.id);
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
    async (): Promise<CosmosValidatorItem[]> => {
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
          votingPower: 0,
          commission,
          estimatedYearlyRewardsRate: 0,
        };
      });
      return validators;
    },
    () => this._currency.id
  );

  getValidators = async (): Promise<CosmosValidatorItem[]> => {
    // validators need the rewardsState ONLY to compute voting power as
    // percentage instead of raw uatoms amounts
    return await this.cacheValidators();
  };

  hydrateValidators = (validators: CosmosValidatorItem[]): void => {
    log(
      `${this._currency.id}/validators`,
      "hydrate " + validators.length + " validators"
    );
    this.cacheValidators.hydrate("", validators);
  };
}
