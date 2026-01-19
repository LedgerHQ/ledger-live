// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import type { HederaCoinConfig } from "@ledgerhq/coin-hedera/config";
import type {
  TransactionStatus,
  Transaction,
  HederaAccount,
} from "@ledgerhq/coin-hedera/types/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-hedera/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const getCurrencyConfig = (currency: CryptoCurrency | undefined) => {
  invariant(currency, "hedera: missing currency in getCurrencyConfig");
  return getCurrencyConfiguration<HederaCoinConfig>(currency);
};

const bridge: Bridge<Transaction, HederaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, hederaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
