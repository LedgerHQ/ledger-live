// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import Kaspa from "@ledgerhq/hw-app-kaspa";
import Transport from "@ledgerhq/hw-transport";
import { createResolver, CreateSigner, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { KaspaSigner } from "@ledgerhq/coin-kaspa/types/signer";
import { KaspaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-kaspa/types/bridge";
import { createBridges } from "@ledgerhq/coin-kaspa/bridge";
import type { Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-kaspa/test/cli";

const createSigner: CreateSigner<KaspaSigner> = (transport: Transport) => {
  return new Kaspa(transport);
};

// const kaspaCoin = getCryptoCurrencyById("kaspa");
const resolver: Resolver = createResolver(createSigner, kaspaResolver);
// const getCurrencyConfig = (): KaspaCoinConfig => getCurrencyConfiguration(kaspaCoin);

const bridge: Bridge<Transaction, KaspaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);
const cliTools = makeCliTools;

export { bridge, cliTools, resolver };
