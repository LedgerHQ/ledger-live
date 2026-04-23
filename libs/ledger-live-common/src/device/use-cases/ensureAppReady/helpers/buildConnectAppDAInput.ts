import type {
  ApplicationConstraint,
  ApplicationDependency,
  ApplicationVersionConstraint,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { ConnectAppDAInput } from "@ledgerhq/live-dmk-shared";
import { getDeprecationConfig, getMinVersion } from "../../../../apps";
import { getCryptoCurrencyById } from "../../../../currencies";
import getAddress from "../../../../hw/getAddress";
import type { EnsureAppReadyInput } from "../types";

function appNameToDependency(appName: string): ApplicationDependency {
  const constraints = Object.values(DeviceModelId).reduce<ApplicationConstraint[]>(
    (result, model) => {
      const minVersion = getMinVersion(appName, model);

      if (!minVersion) {
        return result;
      }

      result.push({
        minVersion: minVersion as ApplicationVersionConstraint,
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
}): ConnectAppDAInput {
  const { dmk, sessionId, ensureAppReadyInput } = params;

  return {
    application: appNameToDependency(ensureAppReadyInput.appName),
    dependencies: ensureAppReadyInput.dependencies.map(appNameToDependency),
    requireLatestFirmware: ensureAppReadyInput.requireLatestFirmware,
    allowMissingApplication: ensureAppReadyInput.allowPartialDependencies,
    unlockTimeout: 0,
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
