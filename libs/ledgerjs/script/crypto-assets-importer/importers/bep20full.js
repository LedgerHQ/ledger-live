const invariant = require("invariant");
const path = require("path");
const { readFileJSON } = require("../utils");
const {
  findFiatCurrencyByTicker,
} = require("../../../packages/cryptoassets/lib/fiats");

// TODO in future: if we have diff network for bnb we would have to change
const inferParentCurrency = () => "bsc";

const withoutExtraComma = (str) => {
  const m = str.match(/,+$/);
  if (!m) return str;
  return str.slice(0, str.length - m[0].length);
};

const WARN_IF_COUNTERVALUES = true;

const lenseTicker = (a) => a[9] || a[2];

module.exports = {
  // FIXME not yet sure if it's our final path
  paths: ["tokens/bsc/bep20"],
  output: "data/bep20.js",

  validate: (everything, countervaluesTickers) =>
    ["bsc"].flatMap((cid) => {
      const all = everything.filter((a) => a[0] === cid);
      const fiatCollisions = all.filter(
        (a) =>
          findFiatCurrencyByTicker(lenseTicker(a)) &&
          !a[7] &&
          (WARN_IF_COUNTERVALUES
            ? countervaluesTickers.includes(lenseTicker(a))
            : true)
      );
      const contractGroup = {};
      all.forEach((a) => {
        const matches = all.filter((b) => a[6] && b[6] && a[6] === b[6]);
        if (matches.length > 1 && !contractGroup[a[6]]) {
          contractGroup[a[6]] = matches;
        }
      });
      const groups = {};
      all.forEach((a) => {
        if (a[7]) return;
        groups[lenseTicker(a)] = (groups[lenseTicker(a)] || []).concat([a]);
      });
      const dupTickers = Object.keys(groups).filter(
        (a) =>
          groups[a].length > 1 &&
          (WARN_IF_COUNTERVALUES ? countervaluesTickers.includes(a) : true)
      );

      if (Object.keys(contractGroup).length > 0) {
        Object.keys(contractGroup).forEach((key) => {
          console.warn(
            key +
              " contract used in bep20: " +
              contractGroup[key].map((a) => lenseTicker(a)).join(", ")
          );
        });
      }

      if (fiatCollisions.length > 0) {
        console.warn("\nBEP20 THAT COLLIDES WITH FIAT TICKERS:\n");
        fiatCollisions.forEach((t) => {
          console.warn(lenseTicker(t) + " ticker used by bep20: " + t[1]);
        });
      }

      if (dupTickers.length > 0) {
        console.warn("\nBEP20 TICKER COLLISIONS:\n");
        dupTickers.forEach((ticker) => {
          console.warn(
            ticker +
              " ticker is used by bep20: " +
              groups[ticker].map((a) => a[1]).join(", ")
          );
        });
      }

      return all.filter((a) => !contractGroup[a[6]]);
    }),
  outputTemplate: (data) =>
    `module.exports = [
${data
  .map(
    (item) =>
      "[" +
      withoutExtraComma(
        item
          .map((value) => (value === undefined ? "" : JSON.stringify(value)))
          .join(",")
      ) +
      "]"
  )
  .join(",\n")}
];`,

  loader: ({ signatureFolder, folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "common.json")),
      readFileJSON(path.join(signatureFolder, id, "ledger_signature.json")),
    ]).then(([common, ledgerSignature]) => {
      const name = common.name;
      const ticker = common.ticker.toUpperCase();
      const magnitude = common.decimals;
      const contractAddress = common.contract_address;
      const parentCurrency = inferParentCurrency(common);
      const disableCountervalue = !!common.disable_countervalue;
      const delisted = !!common.delisted;
      const countervalueTicker = common.countervalue_ticker;
      try {
        invariant(
          typeof parentCurrency === "string" && parentCurrency,
          "parentCurrency is required"
        );
        invariant(typeof name === "string" && name, "name is required");
        invariant(typeof name === "string" && name, "name is required");
        invariant(typeof id === "string" && id, "id is required");
        invariant(
          typeof ledgerSignature === "string" && ledgerSignature,
          "ledgerSignature is required"
        );
        invariant(
          ledgerSignature.length % 2 === 0 &&
            ledgerSignature.match(/^[0-9a-fA-F]+$/g),
          "ledgerSignature is hexa"
        );
        invariant(
          typeof contractAddress === "string" && contractAddress,
          "contractAddress is required"
        );
        invariant(
          contractAddress.length === 42 &&
            contractAddress.match(/^0x[0-9a-fA-F]+$/g),
          "contractAddress is not eth address"
        );
        invariant(typeof ticker === "string" && ticker, "ticker is required");
        invariant(
          ticker.match(/^[0-9A-Z+_\-*$]+$/g),
          "ticker '%s' alphanum uppercase expected",
          ticker
        );
        invariant(
          typeof magnitude === "number" &&
            Number.isFinite(magnitude) &&
            magnitude >= 0 &&
            magnitude % 1 === 0,
          "magnitude expected positive integer"
        );
      } catch (e) {
        console.error("bep20 " + id + ": " + e);
        return null;
      }
      return [
        parentCurrency,
        id,
        ticker,
        magnitude,
        name,
        ledgerSignature,
        contractAddress,
        disableCountervalue,
        delisted,
        countervalueTicker,
      ];
    }),
};
