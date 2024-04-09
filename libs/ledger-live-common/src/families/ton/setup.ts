// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-ton/bridge/js";
import makeCliTools from "@ledgerhq/coin-ton/cli-transaction";
import nearResolver from "@ledgerhq/coin-ton/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-ton/hw-signMessage";
import { TonSigner } from "@ledgerhq/coin-ton/lib/signer";
import { Transaction } from "@ledgerhq/coin-ton/types";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { TonTransport } from "@ton-community/ton-ledger";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<TonSigner> = (transport: Transport) =>
  new TonTransport(transport) as TonSigner;

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, nearResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
