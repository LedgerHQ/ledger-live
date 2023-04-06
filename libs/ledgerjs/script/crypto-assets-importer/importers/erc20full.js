const invariant = require("invariant");
const path = require("path");
const { readFileJSON } = require("../utils");
const {
  findFiatCurrencyByTicker,
} = require("../../../packages/cryptoassets/lib/fiats");
const {
  getCryptoCurrencyById,
} = require("../../../packages/cryptoassets/lib/currencies");

const inferParentCurrency = (common, folder) =>
  getCryptoCurrencyById(path.basename(path.dirname(folder))).id;

const withoutExtraComma = (str) => {
  const m = str.match(/,+$/);
  if (!m) return str;
  return str.slice(0, str.length - m[0].length);
};

const WARN_IF_COUNTERVALUES = true;

const lenseTicker = (a) => a[9] || a[2];

module.exports = {
  paths: [
    "tokens/ethereum/erc20",
    "tokens/ethereum_goerli/erc20",
    "tokens/ethereum_rinkeby/erc20",
    "tokens/ethereum_ropsten/erc20",
    "tokens/ethereum_sepolia/erc20",
  ],
  output: (toJSON) => `data/erc20.${toJSON ? "json" : "ts"}`,

  validate: (everything, countervaluesTickers) =>
    [
      "ethereum",
      "ethereum_goerli",
      "ethereum_rinkeby",
      "ethereum_ropsten",
      "ethereum_sepolia",
    ].flatMap((cid) => {
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
              " contract used in erc20: " +
              contractGroup[key].map((a) => lenseTicker(a)).join(", ")
          );
        });
      }

      if (fiatCollisions.length > 0) {
        console.warn("\nERC20 THAT COLLIDES WITH FIAT TICKERS:\n");
        fiatCollisions.forEach((t) => {
          console.warn(lenseTicker(t) + " ticker used by erc20: " + t[1]);
        });
      }

      if (dupTickers.length > 0) {
        console.warn("\nERC20 TICKER COLLISIONS:\n");
        dupTickers.forEach((ticker) => {
          console.warn(
            ticker +
              " ticker is used by erc20: " +
              groups[ticker].map((a) => a[1]).join(", ")
          );
        });
      }

      return all.filter((a) => !contractGroup[a[6]]);
    }),
  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data)
      : `export type ERC20Token = [
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  boolean,
  boolean,
  string?,
];
const tokens: ERC20Token[] = [
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
];

export default tokens;
`,

  loader: ({ signatureFolder, folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "common.json")),
      readFileJSON(path.join(signatureFolder, id, "ledger_signature.json")),
    ]).then(([common, ledgerSignature]) => {
      const name = common.name;
      const ticker = common.ticker.toUpperCase();
      const magnitude = common.decimals;
      const contractAddress = common.contract_address;
      const parentCurrency = inferParentCurrency(common, folder);
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
        console.error("erc20 " + id + ": " + e);
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
