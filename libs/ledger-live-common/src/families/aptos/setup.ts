// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import invariant from "invariant";
import { createBridges } from "@ledgerhq/coin-aptos";
import { AptosAccount, TransactionStatus, type Transaction } from "@ledgerhq/coin-aptos/types";
import Transport from "@ledgerhq/hw-transport";
import Aptos from "@ledgerhq/hw-app-aptos";
import type { Bridge } from "@ledgerhq/types-live";
import aptosResolver from "@ledgerhq/coin-aptos/signer/index";
import type { AptosBridgeConfig } from "@ledgerhq/coin-aptos/config";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<Aptos> = (transport: Transport) => {
  return new Aptos(transport);
};

const getCurrencyConfig = (currencyId?: string) => {
  invariant(currencyId, "aptos: currencyId is required in getCurrencyConfig");
  return getCurrencyConfiguration<AptosBridgeConfig>(currencyId);
};

const bridge: Bridge<Transaction, AptosAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, aptosResolver);

export { bridge, resolver };
