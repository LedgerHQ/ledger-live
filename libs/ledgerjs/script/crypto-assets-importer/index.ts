import path from "path";

import { importEIP712 } from "./importers/eip712";
import { importERC20 } from "./importers/erc20";
import { importEVMTokens } from "./importers/evm";
import { importBEP20 } from "./importers/bep20";
import { importPolygonTokens } from "./importers/polygon";
import { importAsaTokens } from "./importers/asa";
import { importCardanoNativeTokens } from "./importers/cardanoNative";
import { importESDTTokens } from "./importers/esdt";
import { importInternetComputerTokens } from "./importers/internet_computer";
import { importSPLTokens } from "./importers/spl";
import { importStellarTokens } from "./importers/stellar";
import { importTRC10Tokens } from "./importers/trc10";
import { importTRC20Tokens } from "./importers/trc20";

import { importERC20Signatures } from "./importers/erc20-signature";

import { importBEP20Exchange } from "./exchange/bep20";
import { importERC20Exchange } from "./exchange/erc20";
import { importCoinsExchange } from "./exchange/coins";

const outputFolder = path.join(__dirname, "../../packages/cryptoassets/src/data");

const importTokens = async () => {
  await importEIP712(outputFolder);
  await importERC20(outputFolder);
  await importEVMTokens(outputFolder);
  await importBEP20(outputFolder);
  await importPolygonTokens(outputFolder);
  await importAsaTokens(outputFolder);
  await importCardanoNativeTokens(outputFolder);
  await importESDTTokens(outputFolder);
  await importInternetComputerTokens(outputFolder);
  await importSPLTokens(outputFolder);
  await importStellarTokens(outputFolder);
  await importTRC10Tokens(outputFolder);
  await importTRC20Tokens(outputFolder);
};

const importExchangeTokens = async () => {
  await importBEP20Exchange(outputFolder);
  await importERC20Exchange(outputFolder);
  await importCoinsExchange(outputFolder);
};

const importSignatures = async () => {
  await importERC20Signatures(outputFolder);
};

const main = async () => {
  console.log("Starting importing cryptoassets from CDN...");

  await importTokens();
  await importExchangeTokens();
  await importSignatures();

  console.log("Import of cryptoassets finished successfully");
};

main();
