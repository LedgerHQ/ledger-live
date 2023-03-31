const path = require("path");
const Buffer = require("buffer").Buffer;
const { readFileJSON, asUint4be } = require("../utils");
const {
  getCryptoCurrencyById,
} = require("../../../packages/cryptoassets/lib/currencies");

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
  output: (toJSON) => `data/erc20-signatures.${toJSON ? "json" : "ts"}`,

  join: (buffers) =>
    buffers.reduce(
      (acc, b) => Buffer.concat([acc, asUint4be(b.length), b]),
      Buffer.alloc(0)
    ),

  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data.toString("base64"))
      : "export default " + JSON.stringify(data.toString("base64")) + ";\n",

  loader: ({ signatureFolder, folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "common.json")),
      readFileJSON(path.join(signatureFolder, id, "ledger_signature.json")),
    ]).then(([common, ledgerSignature]) => {

      const currency = getCryptoCurrencyById(path.basename(path.dirname(folder)));

      // match crypto-assets convention for tickers: testnet tokens are prefixed with "t"
      // https://github.com/LedgerHQ/crypto-assets/blob/d2fe1cf9a110614650191555b846a2e43eb67b8f/scripts/hsm/coin_parameters/coin_parameters.py#L163
      const prefix = currency.isTestnetFor !== undefined ? 't': '';
      const ticker = Buffer.from(prefix + common.ticker, "ascii");

      const decimals = asUint4be(common.decimals);
      const chainId = asUint4be(currency.ethereumLikeInfo.chainId);
      const contractAddress = Buffer.from(common.contract_address.slice(2), "hex");
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
