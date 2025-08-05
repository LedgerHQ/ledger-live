// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-canton/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import { CantonSigner } from "@ledgerhq/coin-canton";
import cantonResolver from "@ledgerhq/coin-canton/signer";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-canton/test/cli";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-canton/types";
import { LegacySignerCanton } from "@ledgerhq/live-signer-canton";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "../../currencies";

const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
  return new LegacySignerCanton(transport);
};

const getCurrencyConfig = () => {
  return getCurrencyConfiguration<CantonCoinConfig>(getCryptoCurrencyById("canton_network"));
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, cantonResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
