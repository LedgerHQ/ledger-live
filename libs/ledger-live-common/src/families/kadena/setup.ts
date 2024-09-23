// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-kadena/bridge/js";
import makeCliTools from "@ledgerhq/coin-kadena/cli-transaction";
import kadenaResolver from "@ledgerhq/coin-kadena/hw-getAddress";
import { KadenaCoinConfig } from "@ledgerhq/coin-kadena/lib/config";
import { KadenaSigner } from "@ledgerhq/coin-kadena/lib/signer";
import { Transaction } from "@ledgerhq/coin-kadena/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { KadenaApp } from "@zondax/ledger-kadena";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<KadenaSigner> = (transport: Transport) => {
  return new KadenaApp(transport);
};
const getCoinConfig: KadenaCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<KadenaCoinConfig>>(getCryptoCurrencyById("kadena"));

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, kadenaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
