// @flow

import type { AccountData } from "./types";

type Data = Array<mixed>;

export type Result = {
  accounts: AccountData[],
  meta: {
    chunksFormatVersion: number,
    exporterName: string,
    exporterVersion: string
  }
};

/**
 * reduce chunks data array to add on more chunk to it
 * @memberof bridgestream/importer
 */
export function parseChunksReducer(chunks: Data[], chunk: string): Data[] {
  try {
    const data: mixed = JSON.parse(chunk);
    if (!Array.isArray(data)) throw new Error("not an array");
    const [dataLength, index, type] = data;
    if (typeof dataLength !== "number" || dataLength <= 0) {
      throw new Error("invalid dataLength");
    }
    if (typeof index !== "number" || index < 0 || index >= dataLength) {
      throw new Error("invalid index");
    }
    if (typeof type !== "string" || !type) {
      throw new Error("invalid type");
    }
    if (chunks.length > 0 && data[0] !== chunks[0][0]) {
      throw new Error("different dataLength");
    }
    if (chunks.some(c => c[1] === index)) {
      // chunk already exists. we are just ignoring
      return chunks;
    }
    return chunks.concat([data]);
  } catch (e) {
    console.warn(`Invalid chunk ${e.message}. Got: ${chunk}`);
    return chunks;
  }
}

/**
 * check if the chunks have all been retrieved
 * @memberof bridgestream/importer
 */
export const areChunksComplete = (chunks: Data[]): boolean =>
  chunks.length > 0 && chunks[0][0] === chunks.length;

/**
 * return final result of the chunks. assuming you have checked `areChunksComplete`
 * @memberof bridgestream/importer
 */
export function chunksToResult(rawChunks: Data[]): Result {
  const chunks = rawChunks
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map(chunk => chunk.slice(2));
  const accounts = [];
  let meta;
  for (const d of chunks) {
    const [type] = d;
    if (type === "meta") {
      const [, chunksFormatVersion, exporterName, exporterVersion] = d;
      if (
        typeof chunksFormatVersion === "number" &&
        typeof exporterName === "string" &&
        typeof exporterVersion === "string"
      ) {
        meta = { chunksFormatVersion, exporterName, exporterVersion };
      }
    } else if (type === "account") {
      const [, accountData] = d;
      if (accountData && typeof accountData === "object") {
        const {
          id,
          currencyId,
          name,
          freshAddress,
          freshAddressPath,
          index,
          balance
        } = accountData;
        if (
          typeof id === "string" &&
          typeof currencyId === "string" &&
          typeof name === "string" &&
          typeof freshAddress === "string" &&
          typeof freshAddressPath === "string" &&
          typeof index === "number" &&
          typeof balance === "string"
        ) {
          accounts.push({
            id,
            currencyId,
            name,
            freshAddress,
            freshAddressPath,
            index,
            balance
          });
        }
      }
    }
  }
  if (!meta) {
    throw new Error("meta chunk not found");
  }
  return { accounts, meta };
}
