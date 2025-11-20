// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import { createMessageSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getCryptoCurrencyById } from "../../currencies";
import { signMessage } from "@ledgerhq/coin-solana/hw-signMessage";
import { setShouldSkipTokenLoading } from "@ledgerhq/coin-solana/preload";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoAssetsStore } from "../../bridge/crypto-assets";
import { LegacySignerSolana, DmkSignerSol } from "@ledgerhq/live-signer-solana";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

let _solanaLdmkFFEnabled: boolean = false;

let _dmkSignerInstance: DmkSignerSol | null = null;

// temporary solution to dynamically enable/disable the Solana DMK signer,
// waiting for LIVE-20250 to be implemented
// to be removed together with useFeature("ldmkSolanaSigner")
export function setSolanaLdmkEnabled(enabled: boolean): void {
  _solanaLdmkFFEnabled = enabled;
}

const canDMKSignerBeUsed = (
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } =>
  _solanaLdmkFFEnabled &&
  transport.dmk instanceof DeviceManagementKit &&
  typeof transport.sessionId === "string";

// get the same instance if FF gets flipped
export function getSolanaSignerInstance(
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): SolanaSigner {
  if (canDMKSignerBeUsed(transport)) {
    if (!_dmkSignerInstance) {
      _dmkSignerInstance = new DmkSignerSol(transport.dmk, transport.sessionId);
    }
    return _dmkSignerInstance;
  } else {
    return new LegacySignerSolana(transport);
  }
}

const getCurrencyConfig = () =>
  getCurrencyConfiguration<SolanaCoinConfig>(getCryptoCurrencyById("solana"));

try {
  const isCALLazyLoadingEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading");
  setShouldSkipTokenLoading(Boolean(isCALLazyLoadingEnabled));
} catch (error) {
  setShouldSkipTokenLoading(false);
}

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(getSolanaSignerInstance),
  getCurrencyConfig,
  getCryptoAssetsStore,
);

const messageSigner = {
  signMessage: createMessageSigner(getSolanaSignerInstance, signMessage),
};

const resolver: Resolver = createResolver(getSolanaSignerInstance, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
