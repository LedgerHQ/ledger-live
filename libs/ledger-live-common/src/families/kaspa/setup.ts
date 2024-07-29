// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-algorand/bridge/js";
import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import Kaspa from "@ledgerhq/hw-app-kaspa";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { KaspaSigner } from "@ledgerhq/coin-kaspa/lib/signer";
import makeCliTools from "@ledgerhq/coin-algorand/cli-transaction";
import type { Bridge } from "@ledgerhq/types-live";
import { AlgorandAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-algorand/types";

const createSigner: CreateSigner<KaspaSigner> = (transport: Transport) => {
  return new Kaspa(transport);
};

const resolver: Resolver = createResolver(createSigner, kaspaResolver);

const bridge = {};



const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
