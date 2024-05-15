// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-mina/bridge/js";
import makeCliTools from "@ledgerhq/coin-mina/cli-transaction";
import minaResolver from "@ledgerhq/coin-mina/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-mina/types";
import { MinaLedgerJS } from "mina-ledger-js";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { MinaSigner } from "@ledgerhq/coin-mina/lib/signer";
import { MinaCoinConfig } from "@ledgerhq/coin-mina/lib/config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<MinaSigner> = (transport: Transport) => {
  return new MinaLedgerJS(transport);
};

const getCoinConfig: MinaCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<MinaCoinConfig>>(getCryptoCurrencyById("mina"));

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, minaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
