// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import type {
  TransactionStatus,
  Transaction,
  HederaAccount,
} from "@ledgerhq/coin-hedera/types/index";
import type { Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-hedera/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const bridge: Bridge<Transaction, HederaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, hederaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
