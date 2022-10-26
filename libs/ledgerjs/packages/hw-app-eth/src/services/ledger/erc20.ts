import blob from "@ledgerhq/cryptoassets/data/erc20-signatures";
import { log } from "@ledgerhq/logs";
import axios from "axios";
import { LoadConfig } from "../types";
import { getLoadConfig } from "./loadConfig";

export const findERC20SignaturesInfo = async (
  userLoadConfig: LoadConfig
): Promise<string | undefined> => {
  const { cryptoassetsBaseURL } = getLoadConfig(userLoadConfig);
  if (!cryptoassetsBaseURL) return;
  const url = `${cryptoassetsBaseURL}/erc20-signatures.json`;
  const response = await axios.get<string>(url).catch((e) => {
    log("error", "could not fetch from " + url + ": " + String(e));
    return null;
  });
  if (!response) return;
  return response.data;
};

/**
 * Retrieve the token information by a given contract address if any
 */
export const byContractAddressAndChainId = (
  contract: string,
  chainId: number,
  erc20SignaturesBlob?: string
): TokenInfo | null | undefined => {
  // If we are able to fetch data from s3 bucket that contains dynamic CAL
  if (erc20SignaturesBlob) {
    return parse(erc20SignaturesBlob).byContractAndChainId(
      asContractAddress(contract),
      chainId
    );
  }
  // the static fallback when dynamic cal is not provided
  return get().byContractAndChainId(asContractAddress(contract), chainId);
};

/**
 * list all the ERC20 tokens informations
 */
export const list = (erc20SignaturesBlob?: string): TokenInfo[] => {
  // If we are able to fetch data from s3 bucket that contains dynamic CAL
  if (erc20SignaturesBlob) {
    return parse(erc20SignaturesBlob).list();
  }
  // the static fallback when dynamic cal is not provided
  return get().list();
};

export type TokenInfo = {
  contractAddress: string;
  ticker: string;
  decimals: number;
  chainId: number;
  signature: Buffer;
  data: Buffer;
};
export type API = {
  byContractAndChainId: (
    addr: string,
    id: number
  ) => TokenInfo | null | undefined;
  list: () => TokenInfo[];
};

const asContractAddress = (addr: string) => {
  const a = addr.toLowerCase();
  return a.startsWith("0x") ? a : "0x" + a;
};

const parse = (erc20SignaturesBlob: string) => {
  const buf = Buffer.from(erc20SignaturesBlob, "base64");
  const map = {};
  const entries: TokenInfo[] = [];
  let i = 0;

  while (i < buf.length) {
    const length = buf.readUInt32BE(i);
    i += 4;
    const item = buf.slice(i, i + length);
    let j = 0;
    const tickerLength = item.readUInt8(j);
    j += 1;
    const ticker = item.slice(j, j + tickerLength).toString("ascii");
    j += tickerLength;
    const contractAddress = asContractAddress(
      item.slice(j, j + 20).toString("hex")
    );
    j += 20;
    const decimals = item.readUInt32BE(j);
    j += 4;
    const chainId = item.readUInt32BE(j);
    j += 4;
    const signature = item.slice(j);
    const entry: TokenInfo = {
      ticker,
      contractAddress,
      decimals,
      chainId,
      signature,
      data: item,
    };
    entries.push(entry);
    map[String(chainId) + ":" + contractAddress] = entry;
    i += length;
  }

  const api = {
    list: () => entries,
    byContractAndChainId: (contractAddress, chainId) =>
      map[String(chainId) + ":" + contractAddress],
  };
  return api;
};

// this internal get() will lazy load and cache the data from the erc20 data blob
const get: () => API = (() => {
  let cache: API | undefined;
  return () => {
    if (cache) return cache;
    const api = parse(blob);
    cache = api;
    return api;
  };
})();
