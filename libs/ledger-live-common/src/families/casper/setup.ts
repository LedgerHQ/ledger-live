// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-casper/bridge";
import casperResolver from "@ledgerhq/coin-casper/signer";
import { signMessage } from "@ledgerhq/coin-casper/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import { createMessageSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-casper/types";
import { getCurrencyConfiguration } from "../../config";
import { createDeviceSigner as createSigner } from "./deviceSigner";
import type { CasperCoinConfig } from "@ledgerhq/coin-casper/types";

const getCoinConfig: CasperCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<CasperCoinConfig>>("casper");

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, casperResolver);

export { bridge, messageSigner, resolver };
