// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge/js";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-celo/hw-signMessage";
import { EvmSigner } from "@ledgerhq/coin-celo/signer";
import { Transaction } from "@ledgerhq/coin-celo/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Vet from "@ledgerhq/hw-app-vet";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import { celoConfig } from "./config";

const createSigner: CreateSigner<EvmSigner> = (transport: Transport) => new Vet(transport);

const getCoinConfig: celoConfig = () =>
  getCurrencyConfiguration<ReturnType<celoConfig>>(getCryptoCurrencyById("ton"));

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, CeloResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
