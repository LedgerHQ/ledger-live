// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-filecoin/index";
import Transport from "@ledgerhq/hw-transport";
import FilecoinApp from "@zondax/ledger-filecoin";
import filecoinResolver from "@ledgerhq/coin-filecoin/hw-getAddress";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-filecoin/cli-transaction";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-filecoin/types";
import { FileCoinCurrencyConfig } from "./config";

const createSigner: CreateSigner<FilecoinApp> = (transport: Transport) => {
  return new FilecoinApp(transport);
};

const filecoin = getCryptoCurrencyById("filecoin");
const getCurrencyConfig = (): FileCoinCurrencyConfig => {
  return getCurrencyConfiguration(filecoin);
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, filecoinResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
