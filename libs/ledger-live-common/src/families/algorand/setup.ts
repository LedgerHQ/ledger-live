// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-algorand/bridge/js";
import makeCliTools from "@ledgerhq/coin-algorand/cli-transaction";
import algorandResolver from "@ledgerhq/coin-algorand/hw-getAddress";
import { AlgorandAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-algorand/types";
import Algorand from "@ledgerhq/hw-app-algorand";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Algorand> = (transport: Transport) => {
  return new Algorand(transport);
};

const bridge: Bridge<Transaction, AlgorandAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, algorandResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
