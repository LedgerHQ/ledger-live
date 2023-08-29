import fs from "fs";
import invariant from "invariant";

export const readFileJSON = (path: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) reject(err);
      else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      }
    });
  });

export const JSONstringifyReadableArray = (array: object[]) =>
  "[\n" + array.map(item => JSON.stringify(item)).join(",\n") + "\n]";

export const ENTRIES_CHECKS = {
  currencyId: (currencyId: string) => {
    invariant(typeof currencyId === "string" && currencyId, "currencyId is required");
    return currencyId;
  },
  name: (name: string) => {
    invariant(typeof name === "string" && name, "name is required");
    return name;
  },
  ticker: (ticker: string, chain) => {
    const uppercaseTicker = ticker.toUpperCase();
    invariant(typeof uppercaseTicker === "string" && uppercaseTicker, "ticker is required");
    invariant(
      uppercaseTicker.match(/^[0-9A-Z+_\-*$]+$/g),
      "ticker '%s' alphanum uppercase expected",
      uppercaseTicker,
    );
    return chain.isTestNet ? "t" + uppercaseTicker : uppercaseTicker;
  },
  decimals: (decimals: number) => {
    invariant(
      typeof decimals === "number" &&
        Number.isFinite(decimals) &&
        decimals >= 0 &&
        decimals % 1 === 0,
      "decimals expected positive integer",
    );
    return decimals;
  },
  contractAddress: (contractAddress: string) => {
    invariant(
      typeof contractAddress === "string" && contractAddress,
      "contractAddress is required",
    );
    invariant(
      contractAddress.length === 42 && contractAddress.match(/^0x[0-9a-fA-F]+$/g),
      "contractAddress is not eth address",
    );

    return contractAddress;
  },
  disableCountervalue: (disableCountervalue: boolean) => !!disableCountervalue,
  delisted: (delisted: boolean) => !!delisted,
  countervalueTicker: (countervalueTicker: string) => countervalueTicker || null,
};

export const asUint4be = (value: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value);
  return b;
};
