// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-kadena/bridge/js";
import makeCliTools from "@ledgerhq/coin-kadena/cli-transaction";
import kadenaResolver from "@ledgerhq/coin-kadena/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-kadena/types";
import Kadena from "@zondax/hw-app-kda";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { KadenaSigner } from "@ledgerhq/coin-kadena/lib/signer";

const createSigner: CreateSigner<KadenaSigner> = (transport: Transport) => {
  return new Kadena(transport as any);
};

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, kadenaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
