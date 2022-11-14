const path = require("path");
const Buffer = require("buffer").Buffer;
const { readFileJSON } = require("../utils");
const {
  getCryptoCurrencyById,
} = require("../../../packages/cryptoassets/lib/currencies");

const inferChainId = (common, folder) =>
  getCryptoCurrencyById(path.basename(path.dirname(folder))).ethereumLikeInfo
    .chainId;

const asUint4be = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};

module.exports = {
  paths: [
    "tokens/ethereum/erc20",
    "tokens/ethereum_goerli/erc20",
    "tokens/ethereum_rinkeby/erc20",
    "tokens/ethereum_ropsten/erc20",
    "tokens/ethereum_sepolia/erc20",
    "tokens/bsc/bep20",
    "tokens/polygon/erc20",
  ],
  id: "erc20",
  output: (toJSON) => `data/erc20-signatures.js${toJSON ? "on" : ""}`,

  join: (buffers) =>
    buffers.reduce(
      (acc, b) => Buffer.concat([acc, asUint4be(b.length), b]),
      Buffer.alloc(0)
    ),

  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data.toString("base64"))
      : "module.exports = " + JSON.stringify(data.toString("base64")) + ";",

  loader: ({ signatureFolder, folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "common.json")),
      readFileJSON(path.join(signatureFolder, id, "ledger_signature.json")),
    ]).then(([common, ledgerSignature]) => {
      const decimals = asUint4be(common.decimals);
      const contractAddress = Buffer.from(
        common.contract_address.slice(2),
        "hex"
      );
      const ticker = Buffer.from(common.ticker, "ascii");
      const chainId = asUint4be(inferChainId(common, folder));
      const signature = Buffer.from(ledgerSignature, "hex");
      return Buffer.concat([
        Buffer.from([ticker.length]),
        ticker,
        contractAddress,
        decimals,
        chainId,
        signature,
      ]);
    }),
};
