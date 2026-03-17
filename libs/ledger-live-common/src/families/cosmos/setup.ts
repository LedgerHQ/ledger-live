// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-cosmos/bridge/index";
import makeCliTools from "@ledgerhq/coin-cosmos/cli";
import { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import cosmosResolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import {
  CosmosAccount,
  CosmosOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-cosmos/types/index";
import { CosmosSigner } from "@ledgerhq/coin-cosmos/types/signer";
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerCosmos, LegacySignerCosmos } from "@ledgerhq/live-signer-cosmos";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";
import { isDmkTransport } from "../../hw/dmkUtils";

let _cosmosLdmkFFEnabled: boolean = false;

export const setCosmosLdmkEnabled = (enabled: boolean): void => {
  _cosmosLdmkFFEnabled = enabled;
};

const createSigner: CreateSigner<CosmosSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _cosmosLdmkFFEnabled) {
    return new DmkSignerCosmos(transport.dmk, transport.sessionId);
  }
  return new LegacySignerCosmos(transport);
};

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  if (!currency) {
    throw new Error("No currency provided");
  }
  return getCurrencyConfiguration<CosmosCoinConfig>(currency);
};

const bridge: Bridge<Transaction, CosmosAccount, TransactionStatus, CosmosOperation> =
  createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, cosmosResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
