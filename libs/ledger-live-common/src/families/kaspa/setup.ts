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
import type { KaspaCoinConfig } from "@ledgerhq/coin-kaspa/config";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<KaspaSigner> = (transport: Transport) => {
  return new Kaspa(transport);
};

const resolver: Resolver = createResolver(createSigner, kaspaResolver);

const getCoinConfig = (): KaspaCoinConfig => getCurrencyConfiguration<KaspaCoinConfig>("kaspa");

const bridge: Bridge<Transaction, KaspaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

export { bridge, resolver };
