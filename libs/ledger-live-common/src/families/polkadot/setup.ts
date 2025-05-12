// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import {
  PolkadotAccount,
  TransactionStatus,
  createBridges,
  type Transaction,
} from "@ledgerhq/coin-polkadot";
import Transport from "@ledgerhq/hw-transport";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import type { Bridge } from "@ledgerhq/types-live";
import { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-polkadot/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const createSigner: CreateSigner<Polkadot> = (transport: Transport) => {
  return new Polkadot(transport);
};

const getCurrencyConfig = (currency?: CryptoCurrency): PolkadotCoinConfig => {
  if (!currency) {
    throw new Error("No currency provided");
  }
  return getCurrencyConfiguration<PolkadotCoinConfig>(currency);
};

const bridge: Bridge<Transaction, PolkadotAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, polkadotResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
