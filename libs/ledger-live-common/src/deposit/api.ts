import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { MappedAsset } from "./type";

const ROOT_PATH = getEnv("MAPPING_SERVICE");

export async function getMappedAssets(): Promise<MappedAsset[]> {
  const url = `${ROOT_PATH}/v1/coingecko/mapped-assets`;
  const { data } = await network({ method: "GET", url });
  return data;
}
