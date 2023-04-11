const path = require("path");
const fs = require("fs/promises");
const { ENTRIES_CHECKS, asUint4be } = require("../utils");

const getDefinition = (chain, tokenId, definitionJSON, signature) => {
  try {
    const currencyId = ENTRIES_CHECKS.currencyId(chain.name);
    const name = ENTRIES_CHECKS.name(definitionJSON.name);
    const ticker = ENTRIES_CHECKS.ticker(definitionJSON.ticker);
    const decimals = ENTRIES_CHECKS.decimals(definitionJSON.decimals);
    const contractAddress = ENTRIES_CHECKS.contractAddress(
      definitionJSON.contract_address
    );
    const disableCountervalue = ENTRIES_CHECKS.disableCountervalue(
      definitionJSON.disable_countervalue
    );
    const delisted = ENTRIES_CHECKS.delisted(definitionJSON.delisted);
    const countervalueTicker = ENTRIES_CHECKS.countervalueTicker(
      definitionJSON.countervalue_ticker
    );

    return [
      currencyId,
      tokenId,
      ticker,
      decimals,
      name,
      signature,
      contractAddress,
      disableCountervalue,
      delisted,
      countervalueTicker,
    ];
  } catch (e) {
    console.error(`ERC20 import error: ${chain.name} - ${tokenId}:`, e);

    return null;
  }
};

const getSignatureBuffer = (chain, definitionJSON, signature) => {
  const decimals = asUint4be(definitionJSON.decimals);
  const contractAddress = Buffer.from(
    definitionJSON.contract_address.slice(2),
    "hex"
  );

  // match crypto-assets convention for tickers: testnet tokens are prefixed with "t"
  // https://github.com/LedgerHQ/crypto-assets/blob/d2fe1cf9a110614650191555b846a2e43eb67b8f/scripts/hsm/coin_parameters/coin_parameters.py#L163
  const prefix = chain.isTestNet ? "t" : "";
  const ticker = Buffer.from(prefix + definitionJSON.ticker, "ascii");

  const chainId = asUint4be(chain.chainId);
  const bufferSig = Buffer.from(signature, "hex");

  return Buffer.concat([
    Buffer.from([ticker.length]),
    ticker,
    contractAddress,
    decimals,
    chainId,
    bufferSig,
  ]);
};

module.exports = async (chain, outputFolder) => {
  const outputDir = path.join(
    outputFolder,
    "data",
    "evm",
    chain.chainId.toString()
  );

  const tokenIds = await fs
    .readdir(chain.signaturePath, { withFileTypes: true })
    .then((dirents) =>
      dirents
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    )
    .catch(() => []);

  const tokens = [];
  const signatureBuffers = [];
  for (const tokenId of tokenIds) {
    const [definitionJSON, signature] = await Promise.allSettled([
      fs
        .readFile(
          path.join(chain.definitionPath, tokenId, "common.json"),
          "utf-8"
        )
        .then(JSON.parse),
      fs
        .readFile(
          path.join(chain.signaturePath, tokenId, "ledger_signature.json"),
          "utf-8"
        )
        .then(JSON.parse),
    ]).then((promises) => promises.map(({ value }) => value));

    if (!definitionJSON || !signature) {
      continue;
    }

    const definition = getDefinition(chain, tokenId, definitionJSON, signature);
    if (definition) tokens.push(definition);

    const signatureBuffer = getSignatureBuffer(
      chain,
      definitionJSON,
      signature
    );
    if (signatureBuffer) signatureBuffers.push(signatureBuffer);
  }

  const mergedSignatureBuffers = signatureBuffers.reduce(
    (acc, b) => Buffer.concat([acc, asUint4be(b.length), b]),
    Buffer.alloc(0)
  );

  // Make directory for the chain id
  await fs.mkdir(outputDir, { recursive: true });
  // add definitions file
  await fs.writeFile(
    path.join(outputDir, "erc20.json"),
    JSON.stringify(tokens)
  );
  // add signature file
  await fs.writeFile(
    path.join(outputDir, "erc20-signatures.json"),
    JSON.stringify(mergedSignatureBuffers.toString("base64"))
  );
  // add index.ts to easily import
  await fs.writeFile(
    path.join(outputDir, "index.ts"),
    // eslint-disable-next-line prettier/prettier
    'import tokens from "./erc20.json";' +
      String.fromCharCode(10) + // lf line break for linter
      // eslint-disable-next-line prettier/prettier
      'import signatures from "./erc20-signatures.json";' +
      String.fromCharCode(10) + // lf line break for linter
      "export default { tokens, signatures };\r" +
      String.fromCharCode(10) // lf line break for linter
  );
};
