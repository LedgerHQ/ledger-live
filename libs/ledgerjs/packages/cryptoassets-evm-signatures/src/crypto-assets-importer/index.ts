import path from "path";

import { importEVMTokens } from "./importers/evm";

const outputFolder = path.join(__dirname, "../data");

const importTokens = async () => {
  const promises = [importEVMTokens(outputFolder)];

  await Promise.allSettled(promises);
};

const main = async () => {
  console.log("Starting importing cryptoassets from CDN...");

  await importTokens();

  console.log("Import of cryptoassets finished successfully");
};

main();
