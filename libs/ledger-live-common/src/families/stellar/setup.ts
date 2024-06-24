// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import { Transaction, StellarAccount, TransactionStatus } from "@ledgerhq/coin-stellar/types/index";
import Transport from "@ledgerhq/hw-transport";
import Stellar from "@ledgerhq/hw-app-str";
import type { Bridge } from "@ledgerhq/types-live";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import makeCliTools from "@ledgerhq/coin-stellar/cli";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createBridges } from "@ledgerhq/coin-stellar/bridge/index";
import stellarResolver from "@ledgerhq/coin-stellar/hw-getAddress";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<Stellar> = (transport: Transport) => {
  return new Stellar(transport);
};

const stellar = getCryptoCurrencyById("stellar");
function getCurrencyConfig(): StellarCoinConfig {
  return getCurrencyConfiguration(stellar);
}

const bridge: Bridge<Transaction, StellarAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, stellarResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
