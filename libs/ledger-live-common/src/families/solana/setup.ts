// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Solana from "@ledgerhq/hw-app-solana";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  return new Solana(transport);
};

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
