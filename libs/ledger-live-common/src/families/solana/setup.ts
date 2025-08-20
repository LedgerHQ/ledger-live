// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getCryptoCurrencyById } from "../../currencies";
import { signMessage } from "@ledgerhq/coin-solana/hw-signMessage";
import { LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import { setShouldSkipTokenLoading } from "@ledgerhq/coin-solana/preload";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) =>
  new LegacySignerSolana(transport);

const getCurrencyConfig = () => {
  return getCurrencyConfiguration<SolanaCoinConfig>(getCryptoCurrencyById("solana"));
};

try {
  const isCALLazyLoadingEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading");
  setShouldSkipTokenLoading(Boolean(isCALLazyLoadingEnabled));
} catch (error) {
  setShouldSkipTokenLoading(false);
}

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
