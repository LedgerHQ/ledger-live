// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type TonBridge } from "@ledgerhq/coin-ton/bridge/js";
import makeCliTools from "@ledgerhq/coin-ton/cli-transaction";
import tonResolver from "@ledgerhq/coin-ton/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-ton/hw-signMessage";
import { TonCoinConfig } from "@ledgerhq/coin-ton/config";
import { TonSigner } from "@ledgerhq/coin-ton/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Transport from "@ledgerhq/hw-transport";
import { TonTransport as Ton } from "@ton-community/ton-ledger";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<TonSigner> = (transport: Transport) => new Ton(transport);

const getCoinConfig: TonCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<TonCoinConfig>>(getCryptoCurrencyById("ton"));

const bridge: TonBridge = createBridges(executeWithSigner(createSigner), getCoinConfig);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, tonResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
