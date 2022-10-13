import network from "../../../network";
import { getEnv } from "../../../env";
import { NearStakingDeposit } from "./sdk.types";

const getIndexerUrl = (route: string): string =>
  `${getEnv("API_NEAR_STAKING_POSITIONS_API")}${route || ""}`;

export const getStakingDeposits = async (
  address: string
): Promise<NearStakingDeposit[]> => {
  const { data } = await network({
    method: "GET",
    url: getIndexerUrl(`staking-deposits/${address}`),
  });

  return Array.isArray(data) ? data : [];
};
