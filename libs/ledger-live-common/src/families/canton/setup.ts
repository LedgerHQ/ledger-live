// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-canton/bridge/index";
import { getEnv } from "@ledgerhq/live-env";
import Transport from "@ledgerhq/hw-transport";
import { CantonSigner } from "@ledgerhq/coin-canton";
import cantonResolver from "@ledgerhq/coin-canton/signer";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-canton/test/cli";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-canton/types";
import { LegacySignerCanton } from "@ledgerhq/live-signer-canton";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import cantonBridgeMock from "./bridge/mock";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "../../currencies";

const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
  return new LegacySignerCanton(transport);
};

const getCurrencyConfig = () => {
  // Use devnet for development/testing
  const currencyId = getEnv("MOCK") ? "canton_network_devnet" : "canton_network_devnet";
  return getCurrencyConfiguration<CantonCoinConfig>(getCryptoCurrencyById(currencyId));
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = getEnv("MOCK")
  ? cantonBridgeMock
  : createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, cantonResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
