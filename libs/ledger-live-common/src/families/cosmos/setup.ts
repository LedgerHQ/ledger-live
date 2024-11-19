// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-cosmos/bridge/index";
import makeCliTools from "@ledgerhq/coin-cosmos/cli";
import { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import cosmosResolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import { CosmosAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-cosmos/types/index";
import { CosmosSigner } from "@ledgerhq/coin-cosmos/types/signer";
import Cosmos from "@ledgerhq/hw-app-cosmos";
import Transport from "@ledgerhq/hw-transport";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Bridge } from "@ledgerhq/types-live";
import { CosmosApp } from "@zondax/ledger-cosmos-js";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<CosmosSigner ou CryptoOrgSigner> = (transport: Transport, currencyId) => {
  const cosmos = new CosmosApp(transport);
  const cryptoOrg - new Cosmos()
  return currencyId === "cryptoorg" ? {
      // Here we rely on hw-app-cosmos, the lib for cryptoorg
      getAddressAndPubKey: cosmos.getAddressAndPubKey.bind(cosmos),
      sign: cosmos.sign.bind(cosmos),
      getAddress: cosmos.getAddressAndPubKey()
    } :
    {
      // here we rely on @zondax/ledger-cosmos-js
      getAddressAndPubKey: cosmos.getAddressAndPubKey.bind(cosmos),
      sign: cosmos.sign.bind(cosmos),
      getAddress: cosmos.getAddressAndPubKey()
    },
  };
};

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  if (!currency) {
    throw new Error("No currency provided");
  }
  return getCurrencyConfiguration<CosmosCoinConfig>(currency);
};
const bridge: Bridge<Transaction, CosmosAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, cosmosResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
