import axios from "axios";
import { log } from "@ledgerhq/logs";
import { signatures as signaturesByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import { getLoadConfig } from "./loadConfig";
import { LoadConfig } from "../types";

const asContractAddress = (addr: string) => {
  const a = addr.toLowerCase();
  return a.startsWith("0x") ? a : "0x" + a;
};

export const findERC20SignaturesInfo = async (
  userLoadConfig: LoadConfig,
  chainId: number
): Promise<string | null> => {
  const { cryptoassetsBaseURL } = getLoadConfig(userLoadConfig);
  if (!cryptoassetsBaseURL) return null;

  const url = `${cryptoassetsBaseURL}/evm/${chainId}/erc20-signatures.json`;
  const blob = await axios
    .get<string>(url)
    .then(({ data }) => {
      if (!data || typeof data !== "string") {
        throw new Error(
          `ERC20 signatures for chainId ${chainId} file is malformed ${url}`
        );
      }
      return data;
    })
    .catch((e) => {
      log("error", "could not fetch from " + url + ": " + String(e));
      return null;
    });

  return blob;
};

/**
 * Retrieve the token information by a given contract address if any
 */
export const byContractAddressAndChainId = (
  contract: string,
  chainId: number,
  erc20SignaturesBlob?: string | null
): ReturnType<API["byContractAndChainId"]> => {
  // If we are able to fetch data from s3 bucket that contains dynamic CAL
  if (erc20SignaturesBlob) {
    try {
      return parse(erc20SignaturesBlob).byContractAndChainId(
        asContractAddress(contract),
        chainId
      );
    } catch (e) {
      return get(chainId)?.byContractAndChainId(
        asContractAddress(contract),
        chainId
      );
    }
  }

  // the static fallback when dynamic cal is not provided
  return get(chainId)?.byContractAndChainId(
    asContractAddress(contract),
    chainId
  );
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

const parse = (erc20SignaturesBlob: string): API => {
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

  return {
    list: () => entries,
    byContractAndChainId: (contractAddress, chainId) =>
      map[String(chainId) + ":" + contractAddress],
  };
};

// this internal get() will lazy load and cache the data from the erc20 data blob
const get: (chainId: number) => API | null = (() => {
  const cache: Record<number, API> = {};
  return (chainId) => {
    if (cache[chainId]) return cache[chainId];

    const signatureBlob: string | undefined = signaturesByChainId[chainId];
    if (!signatureBlob) return null;

    const api = parse(signatureBlob);
    cache[chainId] = api;
    return api;
  };
})();
