import path from "path";

import { importEVMTokens } from "./importers/evm";
import { importEIP712, importEIP712v2 } from "./importers/eip712";

const outputFolder = path.join(__dirname, "../data");

const importTokens = async () => {
  const promises = [
    importEIP712(outputFolder),
    importEIP712v2(outputFolder),
    importEVMTokens(outputFolder),
  ];

  await Promise.allSettled(promises);
};

const main = async () => {
  console.group();
  console.log("Starting importing cryptoassets from CDN...");
  await importTokens();
  console.log("Import of cryptoassets finished successfully");
  console.groupEnd();
};

main();
