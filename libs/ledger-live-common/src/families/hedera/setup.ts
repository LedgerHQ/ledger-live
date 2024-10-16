// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/hw-getAddress";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-hedera/cli-transaction";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TransactionStatus, Transaction } from "./types";
import { HederaCoinConfig } from "./config";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const hedera = getCryptoCurrencyById("hedera");
const getCurrencyConfig = (): HederaCoinConfig => {
  return getCurrencyConfiguration(hedera);
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, hederaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
