// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { TransactionStatus, createBridges, type Transaction } from "@ledgerhq/coin-hedera";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/hw-getAddress";
import type { Account, Bridge } from "@ledgerhq/types-live";
import { hederaConfig } from "@ledgerhq/coin-hedera/config";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-hedera/cli-transaction";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const hedera = getCryptoCurrencyById("hedera");
const getCurrencyConfig = (): hederaConfig => {
  return getCurrencyConfiguration(hedera);
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, hederaResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
