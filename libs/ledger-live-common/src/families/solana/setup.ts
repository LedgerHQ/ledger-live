// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Transport from "@ledgerhq/hw-transport";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { createMessageSigner, createResolver } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { signMessage } from "@ledgerhq/coin-solana/hw-signMessage";
import coinConfig, { type SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getCurrencyConfiguration } from "../../config";
import { LegacySignerSolana, DmkSignerSol } from "@ledgerhq/live-signer-solana";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

let _solanaLdmkFFEnabled: boolean = false;
let _solanaTxcFFEnabled: boolean = true;

// temporary solution to dynamically enable/disable the Solana DMK signer,
// waiting for LIVE-20250 to be implemented
// to be removed together with useFeature("ldmkSolanaSigner")
export function setSolanaLdmkEnabled(enabled: boolean): void {
  _solanaLdmkFFEnabled = enabled;
}

export function setSolanaTxcEnabled(enabled: boolean): void {
  _solanaTxcFFEnabled = enabled;
}

export const canDMKSignerBeUsed = (
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } =>
  _solanaLdmkFFEnabled &&
  transport.dmk instanceof DeviceManagementKit &&
  typeof transport.sessionId === "string";

export function getSolanaSignerInstance(
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): SolanaSigner {
  if (canDMKSignerBeUsed(transport)) {
    return new DmkSignerSol(transport.dmk, transport.sessionId, {
      transactionChecks: !_solanaTxcFFEnabled,
    });
  }
  return new LegacySignerSolana(transport);
}

// No `bridge` export: the generic coin framework builds it from the Coin Module API.
// `hw-signMessage` still reads the module's config singleton, which the legacy bridge installed.
coinConfig.setCoinConfig(() => getCurrencyConfiguration<SolanaCoinConfig>("solana"));
const messageSigner = {
  signMessage: createMessageSigner(getSolanaSignerInstance, signMessage),
};

const resolver: Resolver = createResolver(getSolanaSignerInstance, solanaResolver);

export { messageSigner, resolver };
