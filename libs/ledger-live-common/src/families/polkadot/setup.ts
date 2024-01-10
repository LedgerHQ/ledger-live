// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-polkadot/bridge/index";
import { makeCliTools } from "@ledgerhq/coin-polkadot/test/index";
import polkadotResolver from "@ledgerhq/coin-polkadot/bridge/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-polkadot/types/index";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import Transport from "@ledgerhq/hw-transport";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Polkadot> = (transport: Transport) => {
  return new Polkadot(transport);
};

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
  network,
  makeLRUCache,
);

const resolver: Resolver = createResolver(createSigner, polkadotResolver);

const cliTools = makeCliTools(network, makeLRUCache);

export { bridge, cliTools, resolver };
