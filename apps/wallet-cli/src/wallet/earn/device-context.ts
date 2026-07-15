import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { getManagerAppNameForCurrencyId } from "../../session/bridge-device-session";
import type { AccountDescriptor } from "../models";

export type EarnDeviceContext = {
  deviceId: string;
  managerAppName: string;
  deviceTimeoutMs?: number;
};

export function buildEarnDeviceContext(params: {
  descriptor: AccountDescriptor;
  dryRun: boolean;
  deviceTimeoutMs?: number;
}): EarnDeviceContext | undefined {
  const { descriptor, dryRun, deviceTimeoutMs } = params;
  if (dryRun) return undefined;
  return {
    deviceId: WALLET_CLI_DMK_DEVICE_ID,
    managerAppName: getManagerAppNameForCurrencyId(descriptor.currencyId),
    deviceTimeoutMs,
  };
}
