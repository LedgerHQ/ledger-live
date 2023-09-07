import { log } from "console";
import path from "path";

import { importEIP712 } from "./importers/eip712";
import { importBEP20 } from "./importers/bep20";
import { importERC20 } from "./importers/erc20";
import { importPolygonTokens } from "./importers/polygontokens";
import { importAsaTokens } from "./importers/asa";

import { importBEP20Exchange } from "./exchange/bep20";
import { importCoinsExchange } from "./exchange/coins";
import { importERC20Exchange } from "./exchange/erc20";

import { importERC20Signatures } from "./importers/erc20-signature";
import { importTRC10Tokens } from "./tron/sync-trc10-tokens";
import { importCardanoNativeTokens } from "./importers/cardanoNative";

const outputFolder = path.join(__dirname, "../../packages/cryptoassets/src/data");

const importTokens = async () => {
  await importEIP712(outputFolder);
  await importERC20(outputFolder);
  await importBEP20(outputFolder);
  await importPolygonTokens(outputFolder);
  await importTRC10Tokens(outputFolder);
  await importAsaTokens(outputFolder);
  await importCardanoNativeTokens(outputFolder);
};

const importExchangeTokens = async () => {
  await importBEP20Exchange(outputFolder);
  await importCoinsExchange(outputFolder);
  await importERC20Exchange(outputFolder);
};

const importSignatures = async () => {
  await importERC20Signatures(outputFolder);
};

const main = async () => {
  log("Starting importing cryptoassets from CDN...");

  await importTokens();
  await importExchangeTokens();
  await importSignatures();

  log("Import of cryptoassets finished successfully");
};

main();
