// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-canton/bridge/index";
import { getEnv } from "@ledgerhq/live-env";
import Transport from "@ledgerhq/hw-transport";
import { CantonSigner } from "@ledgerhq/coin-canton";
import cantonResolver from "@ledgerhq/coin-canton/signer";
import type { Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-canton/test/cli";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TransactionStatus, Transaction, CantonAccount } from "@ledgerhq/coin-canton/types";
import { LegacySignerCanton } from "@ledgerhq/live-signer-canton";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import cantonBridgeMock from "./bridge/mock";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
  return new LegacySignerCanton(transport);
};

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  if (!currency) {
    throw new Error("currency not defined");
  }
  return getCurrencyConfiguration<CantonCoinConfig>(currency);
};

const bridge: Bridge<Transaction, CantonAccount, TransactionStatus> = getEnv("MOCK")
  ? cantonBridgeMock
  : createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, cantonResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
