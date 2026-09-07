import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { ConnectAppDAInput } from "@ledgerhq/live-dmk-shared";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  buildApplicationDependency,
  type GetMinVersion,
} from "../../../buildApplicationDependency";
import getAddress from "../../../../hw/getAddress";
import type { EnsureAppReadyInput } from "../types";

export type { GetMinVersion };
export type GetDeprecationConfig = (
  appName: string,
  dependencies?: string[],
) => ConnectAppDAInput["deprecationConfig"];

function createRequiredDerivation(params: {
  dmk: DeviceManagementKit;
  sessionId: string;
  ensureAppReadyInput: EnsureAppReadyInput;
}): ConnectAppDAInput["requiredDerivation"] {
  const { dmk, sessionId, ensureAppReadyInput } = params;
  const { requiresDerivation } = ensureAppReadyInput;

  if (!requiresDerivation) {
    return undefined;
  }

  return async () => {
    const transport = new DmkCompatTransport(dmk, sessionId);
    const { currencyId, ...derivationRest } = requiresDerivation;

    dmk._unsafeBypassIntentQueue({ bypass: true, sessionId });

    try {
      const derivation = await getAddress(transport, {
        currency: getCryptoCurrencyById(currencyId),
        ...derivationRest,
      });

      return derivation.address;
    } finally {
      dmk._unsafeBypassIntentQueue({ bypass: false, sessionId });
    }
  };
}

export function buildConnectAppDeviceActionInput(params: {
  dmk: DeviceManagementKit;
  sessionId: string;
  ensureAppReadyInput: EnsureAppReadyInput;
  getMinVersion: GetMinVersion;
  getDeprecationConfig: GetDeprecationConfig;
  unlockTimeout: number;
}): ConnectAppDAInput {
  const {
    dmk,
    sessionId,
    ensureAppReadyInput,
    getMinVersion,
    getDeprecationConfig,
    unlockTimeout,
  } = params;

  return {
    application: buildApplicationDependency(ensureAppReadyInput.appName, getMinVersion),
    dependencies: ensureAppReadyInput.dependencies.map(appName =>
      buildApplicationDependency(appName, getMinVersion),
    ),
    requireLatestFirmware: ensureAppReadyInput.requireLatestFirmware,
    allowMissingApplication: false,
    allowNonOnboardedDevice: false,
    unlockTimeout,
    requiredDerivation: createRequiredDerivation({
      dmk,
      sessionId,
      ensureAppReadyInput,
    }),
    deprecationConfig: getDeprecationConfig(
      ensureAppReadyInput.appName,
      ensureAppReadyInput.dependencies,
    ),
  };
}
