// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-canton/bridge/index";
import { getEnv } from "@shared/env";
import Transport from "@ledgerhq/hw-transport";
import { CantonSigner } from "@ledgerhq/coin-canton";
import cantonResolver from "@ledgerhq/coin-canton/signer";
import type { Bridge } from "@ledgerhq/types-live";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TransactionStatus, Transaction, CantonAccount } from "@ledgerhq/coin-canton/types";
import { LegacySignerCanton } from "@ledgerhq/live-signer-canton";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import cantonBridgeMock from "./bridge/mock";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
  return new LegacySignerCanton(transport);
};

// One bridge serves every Canton network: each call resolves `context.config(currency.id)`.
const bridge: Bridge<Transaction, CantonAccount, TransactionStatus> = getEnv("MOCK")
  ? cantonBridgeMock
  : createBridges(
      executeWithSigner(createSigner),
      buildContext<CantonCoinConfig>("canton_network"),
    );

const resolver: Resolver = createResolver(createSigner, cantonResolver);

export { bridge, resolver };
