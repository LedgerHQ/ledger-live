// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-multiversx/bridge/js";
import makeCliTools from "@ledgerhq/coin-multiversx/cli-transaction";
import multiversxResolver from "@ledgerhq/coin-multiversx/hw-getAddress";
import { MultiversxAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-multiversx/types";
import Multiversx from "../../../../ledgerjs/packages/hw-app-multiversx/lib/Multiversx";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Multiversx> = (transport: Transport) => {
  return new Multiversx(transport);
};

const bridge: Bridge<Transaction, MultiversxAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, multiversxResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
