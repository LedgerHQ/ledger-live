// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import { createBridges } from "@ledgerhq/coin-stellar/bridge/index";
import makeCliTools from "@ledgerhq/coin-stellar/test/cli";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import stellarResolver from "@ledgerhq/coin-stellar/signer/index";
import type {
  StellarAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-stellar/types/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Stellar from "@ledgerhq/hw-app-str";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

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
