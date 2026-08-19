// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { LegacySignerCelo } from "@ledgerhq/live-signer-celo";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { Transaction, CeloAccount } from "./types";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";
import { getCurrencyConfiguration } from "../../config";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";

const createSigner: CreateSigner<CeloSigner> = (transport: Transport) =>
  new LegacySignerCelo(transport);

// Celo owns its config injection: createBridges seeds the Celo coin-config singleton (which its
// bridge reads back via getCoinConfig("celo")), mirroring the Near/Algorand setup.
const getCoinConfig = () => ({ info: getCurrencyConfiguration<EvmConfigInfo>("celo") });
const bridge: Bridge<Transaction, CeloAccount> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

const resolver: Resolver = createResolver(createSigner, CeloResolver);

export { bridge, resolver };
