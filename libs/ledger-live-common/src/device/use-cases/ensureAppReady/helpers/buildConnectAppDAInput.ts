import type {
  ApplicationConstraint,
  ApplicationDependency,
  ApplicationVersionConstraint,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { ConnectAppDAInput } from "@ledgerhq/live-dmk-shared";
import { getCryptoCurrencyById } from "../../../../currencies";
import getAddress from "../../../../hw/getAddress";
import type { EnsureAppReadyInput } from "../types";

export type GetMinVersion = (appName: string, model?: DeviceModelId) => string | undefined;
export type GetDeprecationConfig = (
  appName: string,
  dependencies?: string[],
) => ConnectAppDAInput["deprecationConfig"];

function isApplicationVersionConstraint(version: string): version is ApplicationVersionConstraint {
  return (
    version === "latest" || /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
  );
}

function appNameToDependency(appName: string, getMinVersion: GetMinVersion): ApplicationDependency {
  const constraints = Object.values(DeviceModelId).reduce<ApplicationConstraint[]>(
    (result, model) => {
      const minVersion = getMinVersion(appName, model);

      if (!minVersion || !isApplicationVersionConstraint(minVersion)) {
        return result;
      }

      result.push({
        minVersion,
        applicableModels: [model],
      });

      return result;
    },
    [],
  );

  return {
    name: appName,
    constraints,
  };
}

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
    application: appNameToDependency(ensureAppReadyInput.appName, getMinVersion),
    dependencies: ensureAppReadyInput.dependencies.map(appName =>
      appNameToDependency(appName, getMinVersion),
    ),
    requireLatestFirmware: ensureAppReadyInput.requireLatestFirmware,
    allowMissingApplication: ensureAppReadyInput.allowPartialDependencies,
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
