// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { SuiAccount, TransactionStatus, createBridges, type Transaction } from "@ledgerhq/coin-sui";
import Transport from "@ledgerhq/hw-transport";
import Sui from "@ledgerhq/hw-app-sui";
import type { Bridge } from "@ledgerhq/types-live";
import { SuiCoinConfig } from "@ledgerhq/coin-sui/config";
import { type SuiSigner } from "@ledgerhq/coin-sui/types";
import { getAddress as suiResolver } from "@ledgerhq/coin-sui/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-sui/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const createSigner: CreateSigner<SuiSigner> = (transport: Transport) => {
  return new Sui(transport, "default_sui_scramble_key");
};

const sui = getCryptoCurrencyById("sui");
const getCurrencyConfig = (): SuiCoinConfig => {
  return getCurrencyConfiguration(sui);
};

const bridge: Bridge<Transaction, SuiAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, suiResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
