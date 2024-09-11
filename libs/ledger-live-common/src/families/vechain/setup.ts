// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-vechain/bridge/js";
import makeCliTools from "@ledgerhq/coin-vechain/cli-transaction";
import vechainResolver from "@ledgerhq/coin-vechain/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-vechain/hw-signMessage";
import { VechainSigner } from "@ledgerhq/coin-vechain/signer";
import { Transaction } from "@ledgerhq/coin-vechain/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Vet from "@ledgerhq/hw-app-vet";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import { VechainCoinConfig } from "@ledgerhq/coin-vechain/lib/config";

const createSigner: CreateSigner<VechainSigner> = (transport: Transport) => new Vet(transport);

const getCoinConfig: VechainCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<VechainCoinConfig>>(getCryptoCurrencyById("ton"));

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, vechainResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
