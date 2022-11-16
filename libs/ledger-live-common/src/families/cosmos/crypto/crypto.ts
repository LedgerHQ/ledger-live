import { makeLRUCache } from "../../../cache";
import { CosmosOperationMode, CosmosRewardsState } from "../types";
import network from "../../../network";
import { getCryptoCurrencyById } from "../../../currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { parseUatomStrAsAtomNumber } from "../logic";
//import { CosmosAPI } from "../api/Cosmos";

class Crypto {
  currency: CryptoCurrency;
  currencyId: string;
  lcd: string;
  default_gas = 100000;
  min_gasprice = 0.0025;
  version = "v1beta1";
  gas: {
    [Key in CosmosOperationMode]: number;
  } = {
    // refer to https://github.com/chainapsis/keplr-wallet/blob/master/packages/stores/src/account/cosmos.ts#L113 for the gas fees
    send: 80000,
    delegate: 250000,
    undelegate: 250000,
    redelegate: 250000,
    claimReward: 140000,
    claimRewardCompound: 400000,
  };
  constructor(currencyId: string) {
    if (currencyId === "osmosis") {
      currencyId = "osmo";
    }
    this.currency = getCryptoCurrencyById(currencyId);
    this.currencyId = currencyId;
    if (currencyId === "cosmos") {
      this.lcd = "https://cosmoshub4.coin.ledger.com";
      this.min_gasprice = 0.025;
    } else if (currencyId === "osmo") {
      this.lcd = "https://osmosis.coin.ledger.com/node";
      this.gas = {
        send: 100000,
        delegate: 300000,
        undelegate: 350000,
        redelegate: 550000,
        claimReward: 300000,
        claimRewardCompound: 400000,
      };
    } else if (currencyId === "juno") {
      this.lcd = "https://lcd-juno.itastakers.com";
    } else {
      throw new Error(`${currencyId} is not supported`);
    }
  }
  validatorEstimatedRate(
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number {
    if (this.currencyId === "cosmos") {
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
    } else if (this.currencyId === "osmo") {
      return 0.15; // todo fix this obviously
    } else if (this.currencyId === "juno") {
      return 0.15; // todo fix this obviously
    } else {
      throw new Error(`${this.currencyId} is not supported`);
    }
  }

  getRewardsState(): any {
    if (this.currencyId === "cosmos") {
      return this.getStargateRewardsState;
    } else if (this.currencyId === "osmo") {
      return this.getOsmosisRewardsState;
    } else if (this.currencyId === "juno") {
      return this.getOsmosisRewardsState;
    } else {
      throw new Error(`${this.currencyId} is not supported`);
    }
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
      const assumedTimePerBlock =
        31556736.0 / parseFloat(inflationParametersData.params.blocks_per_year);

      const communityTaxUrl = `${this.lcd}/cosmos/distribution/${this.version}/params`;

      const { data: communityTax } = await network({
        url: communityTaxUrl,
        method: "GET",
      });

      const communityPoolCommission = parseFloat(
        communityTax.params.community_tax
      );
      const minDenom = this.currency.units[1].code;
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
    () => this.currencyId
  );

  private getOsmosisRewardsState = makeLRUCache(
    async () => {
      // TODO fix it
      /*
      const supply = await cosmosAPI.queryTotalSupply(
        this.currency.units[1].code
      );
      const totalSupply = parseUatomStrAsAtomNumber(supply.amount);
      const pool = await cosmosAPI.queryPool();

      const actualBondedRatio =
        parseUatomStrAsAtomNumber(pool.bonded_tokens) / totalSupply;
        */
      const totalSupply = 10000000;
      const actualBondedRatio = 0;
      const communityPoolCommission = parseFloat(
        "0" //community_tax
      );

      // Hardcoded mock values
      const targetBondedRatio = 0.1;
      const assumedTimePerBlock = 7;
      const inflationRateChange = 0.01;
      const inflationMaxRate = 0.01;
      const inflationMinRate = 0.01;
      const averageTimePerBlock = 7;
      const averageDailyFees = 0;
      const currentValueInflation = 0.01;
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
    () => this.currencyId
  );
}

export default Crypto;
