import { CacheRes, makeLRUCache } from "../../../cache";
import network from "../../../network";
import { parseUatomStrAsAtomNumber } from "../logic";
import {
  CosmosDistributionParams,
  CosmosPool,
  CosmosRewardsState,
} from "../types";
import CosmosBase from "./cosmosBase";

class Osmosis extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbonding_period: number;
  ledger_validator: string;
  constructor() {
    super();
    this.unbonding_period = 14;
    this.lcd = "https://osmosis.coin.ledger.com/node";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.gas = {
      send: 100000,
      delegate: 300000,
      undelegate: 350000,
      redelegate: 550000,
      claimReward: 300000,
      claimRewardCompound: 400000,
    };
    this.ledger_validator =
      "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t";
  }
  private queryPool = async (): Promise<CosmosPool> => {
    const { data } = await network({
      method: "GET",
      url: `${this.lcd}/cosmos/staking/${this.version}/pool`,
    });
    return data.pool;
  };

  private queryDistributionParams =
    async (): Promise<CosmosDistributionParams> => {
      const { data } = await network({
        method: "GET",
        url: `${this.lcd}/cosmos/distribution/${this.version}/params`,
      });
      return data.params;
    };

  private queryMintParmas = async (): Promise<any> => {
    const { data } = await network({
      method: "GET",
      url: `${this.lcd}/osmosis/mint/${this.version}/params`,
    });
    return data.params;
  };

  private queryEpochProvisions = async (): Promise<number> => {
    const { data } = await network({
      method: "GET",
      url: `${this.lcd}/osmosis/mint/${this.version}/epoch_provisions`,
    });
    return data.epoch_provisions;
  };

  private queryEpochDuration = async (
    epochIdentifier: string
  ): Promise<number> => {
    const { data } = await network({
      method: "GET",
      url: `${this.lcd}/osmosis/epochs/${this.version}/epochs`,
    });
    const epoch = data.epochs.find(
      (epoch) => epoch.identifier === epochIdentifier
    );
    return epoch ? parseInt(epoch.duration.slice(0, -1)) : 0;
  };

  public getRewardsState(): CacheRes<[], CosmosRewardsState> {
    return makeLRUCache(
      async () => {
        const distributionParams = await this.queryDistributionParams();
        const mintParams = await this.queryMintParmas();
        const epochProvisions = await this.queryEpochProvisions();
        const totalSupply = 100000000;
        const pool = await this.queryPool();
        const actualBondedRatio =
          parseUatomStrAsAtomNumber(pool.bonded_tokens) / totalSupply;
        const communityPoolCommission = parseFloat(
          distributionParams.community_tax
        );
        const stakingRatio: number =
          mintParams["distribution_proportions"]["staking"];
        const epochIdentifier = mintParams["epoch_identifier"];
        const epochDuration = await this.queryEpochDuration(epochIdentifier);
        // Hardcoded mock values
        const targetBondedRatio = 0.1;
        const assumedSecondsPerBlock = 7;
        // refer to https://github.com/chainapsis/keplr-wallet/blob/07673165267d0a29d9ab12303299361bdc2e3338/packages/stores/src/query/cosmos/supply/inflation.ts
        // for osmosis APY and inflation rate calculation
        const inflationRate =
          (epochProvisions * stakingRatio * 365 * 24 * 3600) /
          epochDuration /
          1000000;
        const averageTimePerBlock = 7;
        const averageDailyFees = 0;
        const currentValueInflation = 0.01;
        return {
          targetBondedRatio,
          communityPoolCommission,
          assumedSecondsPerBlock,
          inflationRateChange: inflationRate,
          inflationMaxRate: inflationRate,
          inflationMinRate: inflationRate,
          actualBondedRatio,
          averageTimePerBlock,
          totalSupply,
          averageDailyFees,
          currentValueInflation,
        };
      },
      () => "osmosis"
    );
  }
  public validatorEstimatedRate(
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number {
    return (
      (rewardsState.inflationMaxRate /
        1000000 /
        rewardsState.actualBondedRatio) *
      (1 - validatorCommission)
    );
  }
}

export default Osmosis;
