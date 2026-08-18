import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BlockResponse } from "../types/api";

const getStacksURL = (path: string): string => {
  const baseUrl = getEnv("API_STACKS_ENDPOINT");
  if (!baseUrl) throw new Error("API base URL not available");

  return `${baseUrl}${path}`;
};

const fetchBlock = async (heightOrHash: number | "latest"): Promise<BlockResponse> => {
  const opts: AxiosRequestConfig = {
    method: "GET",
    url: getStacksURL(`/extended/v2/blocks/${heightOrHash}`),
  };
  const { data } = (await network(opts)) as AxiosResponse<BlockResponse>;
  return data;
};

/** Block metadata for a specific height. */
export const fetchBlockByHeight = (height: number): Promise<BlockResponse> => fetchBlock(height);

/** The chain tip block. */
export const fetchLatestBlock = (): Promise<BlockResponse> => fetchBlock("latest");
