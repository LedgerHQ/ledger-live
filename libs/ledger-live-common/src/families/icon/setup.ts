// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-icon/bridge/index";
import makeCliTools from "@ledgerhq/coin-icon/cli-transaction";
import iconResolver from "@ledgerhq/coin-icon/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-icon/types/index";
import Icon from "@ledgerhq/hw-app-icon";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { IconCoinConfig } from "@ledgerhq/coin-icon/config";
import { getEnv } from "@ledgerhq/live-env";

const createSigner: CreateSigner<Icon> = (transport: Transport) => {
  return new Icon(transport);
};

const getCurrencyConfig = (): IconCoinConfig => {
  return {
    status: {
      type: "active",
    },
    infra: {
      indexer: getEnv("ICON_INDEXER_ENDPOINT"),
      indexer_testnet: getEnv("ICON_TESTNET_INDEXER_ENDPOINT"),
      node_endpoint: getEnv("ICON_NODE_ENDPOINT"),
      node_testnet_endpoint: getEnv("ICON_TESTNET_NODE_ENDPOINT"),
      debug_endpoint: getEnv("ICON_DEBUG_ENDPOINT"),
      debug_testnet_endpoint: getEnv("ICON_TESTNET_DEBUG_ENDPOINT"),
    },
  };
};

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, iconResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
