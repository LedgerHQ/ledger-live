// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type Transaction } from "@ledgerhq/coin-polkadot";
import { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-polkadot/test/cli";
import { getEnv } from "@ledgerhq/live-env";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Polkadot> = (transport: Transport) => {
  return new Polkadot(transport);
};

const getCurrencyConfig = (): PolkadotCoinConfig => {
  return {
    status: {
      type: "active",
    },
    sidecar: {
      url: getEnv("API_POLKADOT_SIDECAR"),
      credentials: getEnv("API_POLKADOT_SIDECAR_CREDENTIALS"),
    },
    staking: {
      electionStatusThreshold: getEnv("POLKADOT_ELECTION_STATUS_THRESHOLD"),
    },
  };
};

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, polkadotResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
