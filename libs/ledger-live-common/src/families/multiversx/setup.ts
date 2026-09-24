// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-multiversx/bridge/js";
import type { MultiversXCoinConfig } from "@ledgerhq/coin-multiversx/config";
import multiversxResolver from "@ledgerhq/coin-multiversx/hw-getAddress";
import {
  MultiversXAccount,
  MultiversXOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-multiversx/types";
import MultiversX from "@ledgerhq/hw-app-multiversx";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<MultiversX> = (transport: Transport) => {
  return new MultiversX(transport);
};

const getCurrencyConfig = () => getCurrencyConfiguration<MultiversXCoinConfig>("multiversx");

const bridge: Bridge<Transaction, MultiversXAccount, TransactionStatus, MultiversXOperation> =
  createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, multiversxResolver);

export { bridge, resolver };
