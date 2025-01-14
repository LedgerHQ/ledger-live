// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import {
  AptosAccount,
  TransactionStatus,
  createBridges,
  type Transaction,
} from "@ledgerhq/coin-aptos";
import Transport from "@ledgerhq/hw-transport";
import Aptos from "@ledgerhq/hw-app-aptos";
import type { Bridge } from "@ledgerhq/types-live";
import { AptosCoinConfig } from "@ledgerhq/coin-aptos/config";
import aptosResolver from "@ledgerhq/coin-aptos/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-aptos/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const createSigner: CreateSigner<Aptos> = (transport: Transport) => {
  return new Aptos(transport);
};

const aptos = getCryptoCurrencyById("aptos");
const getCurrencyConfig = (): AptosCoinConfig => {
  return getCurrencyConfiguration(aptos);
};

const bridge: Bridge<Transaction, AptosAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, aptosResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
