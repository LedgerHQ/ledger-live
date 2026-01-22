import type { ConcordiumSigner } from "@ledgerhq/coin-concordium";
import { createBridges } from "@ledgerhq/coin-concordium/bridge/index";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import type { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/types";
import { ConcordiumAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-concordium/types";
import makeCliTools from "@ledgerhq/coin-concordium/test/cli";
import Concordium from "@ledgerhq/hw-app-concordium";
import Transport from "@ledgerhq/hw-transport";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport): ConcordiumSigner => {
  return new Concordium(transport);
};

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  if (!currency) {
    throw new Error("currency not defined");
  }
  return getCurrencyConfiguration<ConcordiumCoinConfig>(currency);
};

const bridge: Bridge<Transaction, ConcordiumAccount, TransactionStatus> = getEnv("MOCK")
  ? // TODO: Add mock bridge when available
    createBridges(executeWithSigner(createSigner), getCurrencyConfig)
  : createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
