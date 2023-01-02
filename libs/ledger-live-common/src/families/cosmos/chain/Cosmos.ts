import { CacheRes, makeLRUCache } from "../../../cache";
import network from "../../../network";
import { CosmosRewardsState } from "../types";
import CosmosBase from "./cosmosBase";
import { parseUatomStrAsAtomNumber } from "../logic";

class Cosmos extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbonding_period: number;
  ledger_validators: string[];
  constructor() {
    super();
    this.unbonding_period = 21;
    this.lcd = "https://cosmoshub4.coin.ledger.com";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/360014339340-Earn-Cosmos-ATOM-staking-rewards-in-Ledger-Live?docs=true";
    this.min_gasprice = 0.025;
    this.ledger_validators = [
      "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
    ];
    CosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.push(
      ...this.ledger_validators
    );
  }
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
  public getRewardsState(): CacheRes<[], CosmosRewardsState> {
    return makeLRUCache(
      async () => {
        // All obtained values are strings ; so sometimes we will need to parse them as numbers
        const inflationUrl = `${this.lcd}/cosmos/mint/${this.version}/inflation`;
        const { data: inflationData } = await network({
          url: inflationUrl,
          method: "GET",
        });
        const currentValueInflation = parseFloat(inflationData.inflation);
        const inflationParametersUrl = `${this.lcd}/cosmos/mint/${this.version}/params`;
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
        const assumedSecondsPerBlock =
          31556736.0 /
          parseFloat(inflationParametersData.params.blocks_per_year);
        const communityTaxUrl = `${this.lcd}/cosmos/distribution/${this.version}/params`;
        const { data: communityTax } = await network({
          url: communityTaxUrl,
          method: "GET",
        });
        const communityPoolCommission = parseFloat(
          communityTax.params.community_tax
        );
        const minDenom = "uatom";
        const supplyUrl = `${this.lcd}/cosmos/bank/${this.version}/supply/${minDenom}`;
        const { data: totalSupplyData } = await network({
          url: supplyUrl,
          method: "GET",
        });
        const totalSupply = parseUatomStrAsAtomNumber(
          totalSupplyData.amount.amount
        );
        const ratioUrl = `${this.lcd}/cosmos/staking/${this.version}/pool`;
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
          assumedSecondsPerBlock,
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
      () => "cosmos"
    );
  }
  public validatorEstimatedRate(
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number {
    // This correction changes how inflation is computed vs. the value the network advertises
    const inexactBlockTimeCorrection =
      rewardsState.assumedSecondsPerBlock / rewardsState.averageTimePerBlock;
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
  }
}

export default Cosmos;
