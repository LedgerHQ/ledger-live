// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-vechain/index";
import type { VechainCurrencyConfig } from "@ledgerhq/coin-vechain/config";
import vechainResolver, { signMessage } from "@ledgerhq/coin-vechain/signer/index";
import { Transaction, VechainSigner } from "./types";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Vet from "@ledgerhq/hw-app-vet";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<VechainSigner> = (transport: Transport) => new Vet(transport);

const getCurrencyConfig = (): VechainCurrencyConfig =>
  getCurrencyConfiguration<VechainCurrencyConfig>("vechain");

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, vechainResolver);

export { bridge, messageSigner, resolver };
