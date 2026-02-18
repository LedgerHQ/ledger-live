import { EnvName, EnvValue } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import cryptoFactory from "./chain/chain";
import cosmosBase from "./chain/cosmosBase";
import { CosmosAPI } from "./network/Cosmos";
import type { CosmosValidatorItem } from "./types";

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
    },
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
      const cosmosAPI = new CosmosAPI(this._currency.id, {
        endpoint: this._endPoint,
        version: this._version,
      });
      const validators = await cosmosAPI.getValidators();
      return validators;
    },
    () => this._currency.id,
  );

  getValidators = async (): Promise<CosmosValidatorItem[]> => {
    // validators need the rewardsState ONLY to compute voting power as
    // percentage instead of raw uatoms amounts
    return await this.cacheValidators();
  };

  hydrateValidators = (validators: CosmosValidatorItem[]): void => {
    log(`${this._currency.id}/validators`, "hydrate " + validators.length + " validators");
    this.cacheValidators.hydrate("", validators);
  };
}
