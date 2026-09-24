import network from "@ledgerhq/live-network/network";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BlockResponse } from "../types/api";
import type { StacksCurrencyConfig } from "../config";
import { getStacksBaseUrl } from "./api";

const getStacksURL = (config: StacksCurrencyConfig, path: string): string =>
  `${getStacksBaseUrl(config)}${path}`;

const fetchBlock = async (
  config: StacksCurrencyConfig,
  heightOrHash: number | "latest",
): Promise<BlockResponse> => {
  const opts: AxiosRequestConfig = {
    method: "GET",
    url: getStacksURL(config, `/extended/v2/blocks/${heightOrHash}`),
  };
  const { data } = (await network(opts)) as AxiosResponse<BlockResponse>;
  return data;
};

/** Block metadata for a specific height. */
export const fetchBlockByHeight = (
  config: StacksCurrencyConfig,
  height: number,
): Promise<BlockResponse> => fetchBlock(config, height);

/** The chain tip block. */
export const fetchLatestBlock = (config: StacksCurrencyConfig): Promise<BlockResponse> =>
  fetchBlock(config, "latest");
