import { log } from "console";
import path from "path";

import { importEIP712 } from "./importers/eip712";
import { importERC20 } from "./importers/erc20";
import { importBEP20Exchange } from "./exchange/bep20";
import { importERC20Signatures } from "./importers/erc20-signature";
import { importCoinsExchange } from "./exchange/coins";

log("Starting importing cryptoassets from CDN...");

const CRYPTO_ASSETS_BASE_URL = "https://cdn.live.ledger.com/cryptoassets";
const outputFolder = path.join(__dirname, "../../packages/cryptoassets/src/data");

const importTokens = async () => {
  await importEIP712(CRYPTO_ASSETS_BASE_URL, outputFolder);
  await importERC20(CRYPTO_ASSETS_BASE_URL, outputFolder);
};

const importExchangeTokens = async () => {
  await importBEP20Exchange(CRYPTO_ASSETS_BASE_URL, outputFolder);
  await importCoinsExchange(CRYPTO_ASSETS_BASE_URL, outputFolder);
};

const importSignatures = async () => {
  await importERC20Signatures(CRYPTO_ASSETS_BASE_URL, outputFolder);
};

const main = async () => {
  await importTokens();
  await importExchangeTokens();
  await importSignatures();
};

main();
