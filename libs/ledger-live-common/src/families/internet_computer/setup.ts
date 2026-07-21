// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-internet_computer/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import icpResolver from "@ledgerhq/coin-internet_computer/signer/index";
import { signMessage } from "@ledgerhq/coin-internet_computer/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import { createMessageSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-internet_computer/types/index";
import { DmkSignerICP, LegacySignerICP } from "@ledgerhq/live-signer-icp";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { ICPSigner } from "./types";

let _icpLdmkFFEnabled: boolean = false;

// Temporary switch to enable/disable the ICP DMK signer at runtime, driven by the
// "ldmkInternetComputerSigner" feature flag. To be removed once the DMK signer is the default.
export function setInternetComputerLdmkEnabled(enabled: boolean): void {
  _icpLdmkFFEnabled = enabled;
}

const canDMKSignerBeUsed = (
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } =>
  _icpLdmkFFEnabled &&
  transport.dmk instanceof DeviceManagementKit &&
  typeof transport.sessionId === "string";

export function getICPSignerInstance(
  transport: Transport & Partial<{ dmk: DeviceManagementKit; sessionId: string }>,
): ICPSigner {
  if (canDMKSignerBeUsed(transport)) {
    return new DmkSignerICP(transport.dmk, transport.sessionId);
  }
  return new LegacySignerICP(transport);
}

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(getICPSignerInstance),
);

const messageSigner = {
  signMessage: createMessageSigner(getICPSignerInstance, signMessage),
};

const resolver: Resolver = createResolver(getICPSignerInstance, icpResolver);

export { bridge, messageSigner, resolver };
