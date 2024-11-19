// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-elrond/bridge/js";
import makeCliTools from "@ledgerhq/coin-elrond/cli-transaction";
import elrondResolver from "@ledgerhq/coin-elrond/hw-getAddress";
import { ElrondAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-elrond/types";
import Elrond from "@ledgerhq/hw-app-elrond";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Elrond> = (transport: Transport) => {
  return new Elrond(transport);
};

const bridge: Bridge<Transaction, ElrondAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, elrondResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
