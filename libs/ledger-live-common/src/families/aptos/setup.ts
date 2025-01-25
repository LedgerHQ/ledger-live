// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import {
  AptosAccount,
  TransactionStatus,
  createBridges,
  type Transaction,
} from "@ledgerhq/coin-aptos";
import Transport from "@ledgerhq/hw-transport";
import Aptos from "@ledgerhq/hw-app-aptos";
import type { Bridge } from "@ledgerhq/types-live";
import aptosResolver from "@ledgerhq/coin-aptos/signer/index";
import makeCliTools from "@ledgerhq/coin-aptos/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Aptos> = (transport: Transport) => {
  return new Aptos(transport);
};

const bridge: Bridge<Transaction, AptosAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, aptosResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
