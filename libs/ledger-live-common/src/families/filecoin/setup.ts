// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-filecoin/index";
import Transport from "@ledgerhq/hw-transport";
import FilecoinApp from "@zondax/ledger-filecoin";
import filecoinResolver from "@ledgerhq/coin-filecoin/signer/index";
import { signMessage } from "@ledgerhq/coin-filecoin/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-filecoin/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-filecoin/types/index";

const createSigner: CreateSigner<FilecoinApp> = (transport: Transport) => {
  return new FilecoinApp(transport);
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, filecoinResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
