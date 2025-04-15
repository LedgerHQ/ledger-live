import path from "path";

import { importAsaTokens } from "./importers/asa";
import { importCardanoNativeTokens } from "./importers/cardanoNative";
import { importEIP712, importEIP712v2 } from "./importers/eip712";
import { importESDTTokens } from "./importers/esdt";
import { importEVMTokens } from "./importers/evm";
import { importFilecoinERC20Tokens } from "./importers/filecoin";
import { importSPLTokens } from "./importers/spl";
import { importStellarTokens } from "./importers/stellar";
import { importTonJettonTokens } from "./importers/ton";
import { importTRC10Tokens } from "./importers/trc10";
import { importTRC20Tokens } from "./importers/trc20";
import { importVip180Tokens } from "./importers/vip180";
import { importAptosTokens } from "./importers/apt";

import { importBEP20Exchange } from "./exchange/bep20";
import { importCoinsExchange } from "./exchange/coins";
import { importERC20Exchange } from "./exchange/erc20";
import { importPolygonERC20Exchange } from "./exchange/polygon-erc20";
import { importTRC20Exchange } from "./exchange/trc20";

const outputFolder = path.join(__dirname, "../data");

const importTokens = async () => {
  const promises = [
    importEIP712(outputFolder),
    importEIP712v2(outputFolder),
    importEVMTokens(outputFolder),
    importAsaTokens(outputFolder),
    importCardanoNativeTokens(outputFolder),
    importESDTTokens(outputFolder),
    importSPLTokens(outputFolder),
    importStellarTokens(outputFolder),
    importTRC10Tokens(outputFolder),
    importTRC20Tokens(outputFolder),
    importFilecoinERC20Tokens(outputFolder),
    importTonJettonTokens(outputFolder),
    importVip180Tokens(outputFolder),
    importAptosTokens(outputFolder, "coin"),
    importAptosTokens(outputFolder, "fungible_asset"),
  ];

  await Promise.allSettled(promises);
};

const importExchangeTokens = async () => {
  const promises = [
    importBEP20Exchange(outputFolder),
    importERC20Exchange(outputFolder),
    importPolygonERC20Exchange(outputFolder),
    importCoinsExchange(outputFolder),
    importTRC20Exchange(outputFolder),
  ];

  await Promise.allSettled(promises);
};

const main = async () => {
  console.log("Starting importing cryptoassets from CDN...");

  await importTokens();
  await importExchangeTokens();

  console.log("Import of cryptoassets finished successfully");
};

main();
