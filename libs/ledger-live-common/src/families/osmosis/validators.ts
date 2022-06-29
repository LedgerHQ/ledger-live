import {
  Dec,
  DecUtils,
  Int,
  CoinPretty,
  IntPretty,
  RatePretty,
} from "@keplr-wallet/unit";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "../../currencies";
import { CosmosValidatorsManager } from "../cosmos/CosmosValidatorsManager";
import { nodeEndpoint } from "./api/sdk";
import { osmosisAPI } from "./api/sdk";
import {
  OsmosisDistributionParams,
  OsmosisEpochProvisions,
  OsmosisEpochs,
  OsmosisMintParams,
  OsmosisPool,
  OsmosisTotalSupply,
} from "./OsmosisSupplyTypes";
import { OsmosisRewardsState } from "./types";

const osmosisCryptoCurrency = getCryptoCurrencyById("osmo");

// TODO Refactor this to be a class so that we don't have to query the API multiple times

const getRewardsState = async (): Promise<OsmosisRewardsState> => {
  const distributionParams = await _getDistributionParams();
  const supply = await _getTotalSupply();
  const totalSupply = parseUOsmoStrAsOsmoNumber(supply.amount);
  const pool = await _getPool();

  const actualBondedRatio =
    parseUOsmoStrAsOsmoNumber(pool.bonded_tokens) / totalSupply;
  const communityPoolCommission = parseFloat(distributionParams.community_tax);

  // Hardcoded mock values
  const targetBondedRatio = 0.1;
  const assumedTimePerBlock = 7;
  const inflationRateChange = 0.01;
  const inflationMaxRate = 0.01;
  const inflationMinRate = 0.01;
  const averageTimePerBlock = 7;
  const averageDailyFees = 0;
  const currentValueInflation = 0.01;

  // This prints 53.49, so it can't be right. Maybe it's the APY?
  // const _currentValueInflation = await getInflation();

  console.log(`
    communityPoolCommission: ${communityPoolCommission},
    actualBondedRatio: ${actualBondedRatio},
    totalSupply = ${totalSupply}
  `);

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
};

// TODO fix this (i.e. strip KPLR code and @keplr-wallet/unit libraries)
// Still not sure what inflation is this, yearly, daily and an average or the current one
const getInflation = async () => {
  const mintParams = await _getMintParams();
  const totalSupply = await _getTotalSupply();
  const epochs = await _getEpochs();
  const epochProvisions = await _getEpochProvisions();
  const pool = await _getPool();
  const distributionParams = await _getDistributionParams();
  let inflation = 0;

  if (mintParams.epoch_identifier) {
    const correctEpoch = epochs.epochs.find(
      (e) => e.identifier === mintParams.epoch_identifier
    );
    const epochDuration = correctEpoch
      ? parseInt(correctEpoch.duration.replace("s", "")) // remove seconds
      : undefined;

    let yearMintingProvision = "";
    if (epochDuration) {
      let epochProvision = epochProvisions.epoch_provisions;

      // If epochProvision is a decimal, Keplr just completely strips the decimal digits
      // validate this is correct... Ref: https://github.com/chainapsis/keplr-wallet/blob/7ca025d32db7873b7a870e69a4a42b525e379132/packages/stores/src/query/cosmos/supply/osmosis/epoch-provisions.ts#L42
      if (epochProvision.includes(".")) {
        epochProvision = epochProvision.slice(0, epochProvision.indexOf("."));
      }

      if (epochProvision && totalSupply) {
        // TODO Verify that this calculation is correct, it's done a bit differently than Keplr
        // to avoid importing additional libraries (Dec, CoinPretty)

        const mintingEpochProvision = new BigNumber(epochProvision)
          .multipliedBy(
            new BigNumber(mintParams.distribution_proportions.staking)
          )
          .toFixed(0); // this is to mimick's Keplr's usage of .truncate() but does not yield the same exact result, the difference is less than 0.0001

        // ************************************************************
        // KPLR code for testing figures are correct
        const currencyKPLR = {
          coinDenom: "osmo",
          coinMinimalDenom: "uosmo",
          coinDecimals: 6,
        };
        const coinPrettyEpochProvisionKPLR = new CoinPretty(
          currencyKPLR,
          new Int(epochProvision)
        );

        const mintingEpochProvisionKPLR = new Dec(
          coinPrettyEpochProvisionKPLR
            .toDec()
            .mul(new Dec(mintParams.distribution_proportions.staking))
            .truncate()
            .toString()
        );

        const yearMintingProvisionKPLR = mintingEpochProvisionKPLR.mul(
          new Dec(((365 * 24 * 3600) / epochDuration).toString())
        );
        const total = DecUtils.getPrecisionDec(8);
        let dec = yearMintingProvisionKPLR
          .quo(total)
          .mul(DecUtils.getPrecisionDec(2));
        const totalStr = (() => {
          return DecUtils.getPrecisionDec(8 + 6).toString();
        })();
        const total2 = new Dec(totalStr);

        if (total.gt(new Dec(0))) {
          const ratio = new Dec(pool.bonded_tokens).quo(total2);
          dec = dec
            .mul(
              new Dec(1).sub(
                new RatePretty(distributionParams.community_tax).toDec()
              )
            )
            .quo(ratio);

          console.log("KPLR result is: ", new IntPretty(dec));
          inflation = parseFloat(dec.toString());
        }

        // ************************************************************

        yearMintingProvision = new BigNumber(mintingEpochProvision)
          .multipliedBy((365 * 24 * 3600) / epochDuration)
          .toString();
      }
    }
    if (yearMintingProvision === "" || yearMintingProvision === "0") {
      throw Error("Error getting inflation info");
    }
    if (pool && totalSupply && distributionParams) {
      const bondedTokens = new BigNumber(pool.bonded_tokens);

      // Per Keplr, for osmosis, for now, we assume current supply is 100,000,000 with 6 decimals.
      const currentSupply = new BigNumber(totalSupply.amount);
      if (currentSupply.gt(0)) {
        // Per Keplr: staking APR is calculated as:
        //   new_coins_per_year = inflation_pct * total_supply * (1 - community_pool_tax)
        //   apr = new_coins_per_year / total_bonded_tokens
        const ratio = bondedTokens.dividedBy(currentSupply);
        const result = new BigNumber(yearMintingProvision)
          .multipliedBy(
            new BigNumber(1)
              .minus(new BigNumber(distributionParams.community_tax))
              .dividedBy(ratio)
          )
          .toFixed(0)
          .toString();
        console.log("result: ", result);
      }
    }
  }
  return inflation;
};

const _getMintParams = async (): Promise<OsmosisMintParams> => {
  const mintParams = await osmosisAPI.queryMintParams();
  return mintParams;
};

const _getTotalSupply = async (): Promise<OsmosisTotalSupply> => {
  const denom = osmosisCryptoCurrency.units[1].code;
  const totalSupply = await osmosisAPI.queryTotalSupply(denom);
  return totalSupply;
};

const _getEpochProvisions = async (): Promise<OsmosisEpochProvisions> => {
  const epochProvisions = await osmosisAPI.queryEpochProvisions();
  return epochProvisions;
};

const _getEpochs = async (): Promise<OsmosisEpochs> => {
  const epochs = await osmosisAPI.queryEpochs();
  return epochs;
};

const _getPool = async (): Promise<OsmosisPool> => {
  const pool = await osmosisAPI.queryPool();
  return pool;
};

const _getDistributionParams = async (): Promise<OsmosisDistributionParams> => {
  const distributionParams = await osmosisAPI.queryDistributionParams();
  return distributionParams;
};

const parseUOsmoStrAsOsmoNumber = (uosmos: string) => {
  return parseFloat(uosmos) / 1000000.0;
};

const osmosisValidatorsManager = new CosmosValidatorsManager(
  osmosisCryptoCurrency,
  {
    endPoint: nodeEndpoint,
    namespace: "osmosis",
    rewardsState: async () => getRewardsState(),
  }
);

export default osmosisValidatorsManager;
