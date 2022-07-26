import { getCryptoCurrencyById } from "../../currencies";
import { CosmosValidatorsManager } from "../cosmos/CosmosValidatorsManager";
import { nodeEndpoint } from "./api/sdk";
import { osmosisAPI } from "./api/sdk";
import {
  OsmosisDistributionParams,
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

const _getTotalSupply = async (): Promise<OsmosisTotalSupply> => {
  const denom = osmosisCryptoCurrency.units[1].code;
  const totalSupply = await osmosisAPI.queryTotalSupply(denom);
  return totalSupply;
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
