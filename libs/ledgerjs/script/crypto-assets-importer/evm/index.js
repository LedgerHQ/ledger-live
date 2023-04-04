const path = require("path");
const axios = require("axios");
const fs = require("fs/promises");
const erc20Importer = require("./erc20Importer");
const indexGenerator = require("./indexGenerator");

/**
 * bsc folder contains a "bep20" and not an "erc20" folder
 * this method is here in case it becomes a bigger thing in the future
 */
const getTokenStandardFolderName = async (chainPath) => {
  const standards = ["erc20", "bep20"];

  return Promise.any(
    standards.map(async (standard) => {
      await fs.access(path.join(chainPath, standard), fs.constants.R_OK); // will throw if not existing or readable
      return standard;
    })
  );
};

module.exports = async (inputFolder, outputFolder) => {
  const definitionTokensPath = path.join(inputFolder, "assets/tokens");
  const signaturesTokensPath = path.join(inputFolder, "signatures/prod/tokens");

  // Get all folders names inside the assets/tokens folder
  const chainNames = await fs
    .readdir(definitionTokensPath, { withFileTypes: true })
    .then((paths) => paths.filter((dirent) => dirent.isDirectory()))
    .then((dirents) => dirents.map((dir) => dir.name));

  // Create an array of chains with their paths and chainId
  const chains = await Promise.all(
    chainNames.map(async (chainName) => {
      const chainPath = path.join(definitionTokensPath, chainName);
      const tokenStandardName = await getTokenStandardFolderName(chainPath);

      const definitionPath = path.join(chainPath, tokenStandardName);
      const signaturePath = path.join(
        signaturesTokensPath,
        chainName,
        tokenStandardName
      );

      const baseCommonJSON = await fs
        .readFile(path.join(definitionPath, "base_common.json"))
        .then(JSON.parse);

      const isTestNet = baseCommonJSON.networks.some((network) => network.type === 'test');

      return {
        name: chainName,
        chainId: baseCommonJSON.chain_id,
        isTestNet,
        definitionPath,
        signaturePath,
      };
    })
  );

  // Creating each file for each chain id
  chains.forEach((chain) => erc20Importer(chain, outputFolder));
  // Creating the index.ts gathering all files
  await fs.writeFile(
    path.join(outputFolder, "data", "evm", "index.ts"),
    indexGenerator(chains)
  );
};
