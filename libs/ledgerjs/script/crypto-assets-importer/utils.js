const fs = require("fs");
const invariant = require("invariant");

exports.readFileJSON = (path) =>
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

exports.JSONstringifyReadableArray = (array) =>
  "[\n" + array.map((item) => JSON.stringify(item)).join(",\n") + "\n]";

exports.ENTRIES_CHECKS = {
  currencyId: (currencyId) => {
    invariant(
      typeof currencyId === "string" && currencyId,
      "currencyId is required"
    );
    return currencyId;
  },
  name: (name) => {
    invariant(typeof name === "string" && name, "name is required");
    return name;
  },
  ticker: (ticker) => {
    const uppercaseTicker = ticker.toUpperCase();
    invariant(
      typeof uppercaseTicker === "string" && uppercaseTicker,
      "ticker is required"
    );
    invariant(
      uppercaseTicker.match(/^[0-9A-Z+_\-*$]+$/g),
      "ticker '%s' alphanum uppercase expected",
      uppercaseTicker
    );
    return uppercaseTicker;
  },
  decimals: (decimals) => {
    invariant(
      typeof decimals === "number" &&
        Number.isFinite(decimals) &&
        decimals >= 0 &&
        decimals % 1 === 0,
      "decimals expected positive integer"
    );
    return decimals;
  },
  contractAddress: (contractAddress) => {
    invariant(
      typeof contractAddress === "string" && contractAddress,
      "contractAddress is required"
    );
    invariant(
      contractAddress.length === 42 &&
        contractAddress.match(/^0x[0-9a-fA-F]+$/g),
      "contractAddress is not eth address"
    );

    return contractAddress;
  },
  disableCountervalue: (disableCountervalue) => !!disableCountervalue,
  delisted: (delisted) => !!delisted,
  countervalueTicker: (countervalueTicker) => countervalueTicker || null,
};

exports.asUint4be = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};
