import { CacheRes, makeLRUCache } from "../../../cache";
import { CosmosRewardsState } from "../types";
import CosmosBase from "./cosmosBase";

class Juno extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbonding_period: number;
  ledger_validator: string;
  constructor() {
    super();
    this.lcd = "https://lcd-juno.itastakers.com";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.default_gas = 100000;
    this.unbonding_period = 28;
    this.ledger_validator =
      "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm";
  }
  public getRewardsState(): CacheRes<[], CosmosRewardsState> {
    return makeLRUCache(
      async () => {
        // Hardcoded mock values
        const targetBondedRatio = 0.1;
        const assumedSecondsPerBlock = 7;
        const inflationRateChange = 0.01;
        const inflationMaxRate = 0.01;
        const inflationMinRate = 0.01;
        const averageTimePerBlock = 7;
        const averageDailyFees = 0;
        const currentValueInflation = 0.01;
        return {
          targetBondedRatio,
          communityPoolCommission: 0.03,
          assumedSecondsPerBlock,
          inflationRateChange,
          inflationMaxRate,
          inflationMinRate,
          actualBondedRatio: 0,
          averageTimePerBlock,
          totalSupply: 100000000,
          averageDailyFees,
          currentValueInflation,
        };
      },
      () => "juno"
    );
  }
  public validatorEstimatedRate(
    _validatorCommission: number,
    _rewardsState: CosmosRewardsState
  ): number {
    return 0.15;
  }
}

export default Juno;
