import path from "path";

import { importEIP712 } from "./importers/eip712";
import { importERC20 } from "./importers/erc20";
import { importEVMTokens } from "./importers/evm";
import { importBEP20 } from "./importers/bep20";
import { importPolygonTokens } from "./importers/polygon";
import { importAsaTokens } from "./importers/asa";
import { importCardanoNativeTokens } from "./importers/cardanoNative";
import { importESDTTokens } from "./importers/esdt";
import { importSPLTokens } from "./importers/spl";
import { importStellarTokens } from "./importers/stellar";
import { importTRC10Tokens } from "./importers/trc10";
import { importTRC20Tokens } from "./importers/trc20";

import { importBEP20Exchange } from "./exchange/bep20";
import { importERC20Exchange } from "./exchange/erc20";
import { importCoinsExchange } from "./exchange/coins";

import { importERC20Signatures } from "./importers/erc20-signature";

const outputFolder = path.join(__dirname, "../data");

const importTokens = async () => {
  const promises = [
    importEIP712(outputFolder),
    importERC20(outputFolder),
    importEVMTokens(outputFolder),
    importBEP20(outputFolder),
    importPolygonTokens(outputFolder),
    importAsaTokens(outputFolder),
    importCardanoNativeTokens(outputFolder),
    importESDTTokens(outputFolder),
    importSPLTokens(outputFolder),
    importStellarTokens(outputFolder),
    importTRC10Tokens(outputFolder),
    importTRC20Tokens(outputFolder),
  ];

  await Promise.allSettled(promises);
};

const importExchangeTokens = async () => {
  const promises = [
    importBEP20Exchange(outputFolder),
    importERC20Exchange(outputFolder),
    importCoinsExchange(outputFolder),
  ];

  await Promise.allSettled(promises);
};

const importSignatures = async () => {
  const promises = [importERC20Signatures(outputFolder)];

  await Promise.allSettled(promises);
};

const main = async () => {
  console.log("Starting importing cryptoassets from CDN...");

  await importTokens();
  await importExchangeTokens();
  await importSignatures();

  console.log("Import of cryptoassets finished successfully");
};

main();
