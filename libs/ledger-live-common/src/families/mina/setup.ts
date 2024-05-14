// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-near/bridge/js";
import makeCliTools from "@ledgerhq/coin-near/cli-transaction";
import nearResolver from "@ledgerhq/coin-near/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-near/types";
import Near from "@ledgerhq/hw-app-near";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { NearSigner } from "@ledgerhq/coin-near/lib/signer";
import { NearCoinConfig } from "@ledgerhq/coin-near/lib/config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<NearSigner> = (transport: Transport) => {
  return new Near(transport);
};

const getCoinConfig: NearCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<NearCoinConfig>>(getCryptoCurrencyById("near"));

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, nearResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
