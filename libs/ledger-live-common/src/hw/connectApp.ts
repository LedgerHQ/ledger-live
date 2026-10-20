import { Observable, throwError } from "rxjs";
import { type DerivationMode, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { AppOp, SkippedAppOp } from "../apps/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { withDevice } from "./deviceAccess";
import getAddress from "./getAddress";
import { getMinVersion, getDeprecationConfig } from "../apps";
import { buildApplicationDependency } from "../device/buildApplicationDependency";
import { LockedDeviceEvent } from "./actions/types";
import type { ApplicationDependency } from "@ledgerhq/device-management-kit";
import { ConnectAppDeviceAction } from "@ledgerhq/live-dmk-shared";
import { ConnectAppEventMapper } from "./connectAppEventMapper";
import { DeviceId } from "@domain/entity-client-identity";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";
import { isDmkTransport } from "./dmkUtils";
import { DmkTransportRequired } from "../errors";
/**
 * Represents the deprecation status of a device.
 *
 * @property warningScreenVisible - Whether the generic deprecation warning screen should be shown.
 * @property clearSigningScreenVisible - Whether the clear signing deprecation warning screen should be shown.
 * @property errorScreenVisible - Whether the deprecation error screen should be shown (blocking usage).
 * @property modelId - The modeID of the affected product
 * @property date - The date when the deprecation becomes effective.
 * @property warningScreenRules - Optional configuration for the warning screen.
 * @property clearSigningScreenRules - Optional configuration for the clear signing screen.
 * @property errorScreenRules - Optional configuration for the error screen.
 * @property onContinue - Callback invoked when the user chooses to continue or throw an error despite the deprecation warning.
 */
export type DeviceDeprecationRules = {
  warningScreenVisible: boolean;
  clearSigningScreenVisible: boolean;
  errorScreenVisible: boolean;
  modelId: LLDeviceModelId;
  date: Date;
  warningScreenRules?: DeviceDeprecationScreenRules;
  clearSigningScreenRules?: DeviceDeprecationScreenRules;
  errorScreenRules?: DeviceDeprecationScreenRules;
  onContinue: (isError?: boolean) => void;
};

/**
 * Configuration defining exceptions to device deprecation restrictions.
 *
 * @property exeption - List of token or main coin identifiers exempt from the restriction.
 * @property deprecatedFlow - List of flow identifiers (e.g., send, receive) to restrict.
 */
export type DeviceDeprecationScreenRules = {
  exception?: string[];
  deprecatedFlow?: string[];
};

export type RequiresDerivation = {
  currencyId: string;
  path: string;
  derivationMode: DerivationMode;
  forceFormat?: string;
};
export type Input = {
  deviceId: string;
  deviceName: string | null;
  request: ConnectAppRequest;
};
export type ConnectAppRequest = {
  appName: string;
  requiresDerivation?: RequiresDerivation;
  dependencies?: string[];
  requireLatestFirmware?: boolean;
  outdatedApp?: AppAndVersion;
  allowPartialDependencies: boolean;
};

export type AppAndVersion = {
  name: string;
  version: string;
  flags: number | Buffer;
};
export type ConnectAppEvent =
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "disconnected";
      expected?: boolean;
    }
  | {
      type: "device-update-last-seen";
      deviceInfo: DeviceInfo;
      latestFirmware: FirmwareUpdateContext | null | undefined;
    }
  | {
      type: "device-permission-requested";
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "device-id";
      deviceId: DeviceId;
    }
  | {
      type: "app-not-installed";
      appNames: string[];
      appName: string;
    }
  | {
      type: "inline-install";
      progress: number;
      itemProgress: number;
      currentAppOp: AppOp;
      installQueue: string[];
    }
  | {
      type: "deprecation";
      deprecate: DeviceDeprecationRules;
    }
  | {
      type: "some-apps-skipped";
      skippedAppOps: SkippedAppOp[];
    }
  | {
      type: "listing-apps";
    }
  | {
      type: "listed-apps";
      installQueue: string[];
    }
  | {
      type: "installed-app-versions";
      apps: { name: string; version: string }[];
    }
  | {
      type: "dependencies-resolved";
    }
  | {
      type: "latest-firmware-resolved";
    }
  | {
      type: "ask-quit-app";
    }
  | {
      type: "ask-open-app";
      appName: string;
    }
  | {
      type: "has-outdated-app";
      outdatedApp: AppAndVersion;
    }
  | {
      type: "opened";
      app?: AppAndVersion;
      derivation?: {
        address: string;
      };
    }
  | {
      type: "display-upgrade-warning";
      displayUpgradeWarning: boolean;
    }
  | LockedDeviceEvent;

const appNameToDependency = (appName: string): ApplicationDependency =>
  buildApplicationDependency(appName, getMinVersion);

export default function connectAppFactory({
  allowNonOnboardedDevice = false,
}: {
  allowNonOnboardedDevice?: boolean;
} = {}) {
  return ({ deviceId, deviceName, request }: Input): Observable<ConnectAppEvent> => {
    const {
      appName,
      requiresDerivation,
      dependencies,
      requireLatestFirmware,
      allowPartialDependencies = false,
    } = request;
    return withDevice(
      deviceId,
      deviceName ? { matchDeviceByName: deviceName } : undefined,
    )(transport => {
      if (!isDmkTransport(transport)) {
        return throwError(() => new DmkTransportRequired());
      }
      const { dmk, sessionId } = transport;
      const deviceAction = new ConnectAppDeviceAction({
        input: {
          application: appNameToDependency(appName),
          dependencies: dependencies ? dependencies.map(name => appNameToDependency(name)) : [],
          requireLatestFirmware,
          allowMissingApplication: allowPartialDependencies,
          allowNonOnboardedDevice,
          unlockTimeout: 0, // Expect to fail immediately when device is locked
          requiredDerivation: requiresDerivation
            ? async () => {
                try {
                  dmk._unsafeBypassIntentQueue({ bypass: true, sessionId });
                  const { currencyId, ...derivationRest } = requiresDerivation;
                  const derivation = await getAddress(transport, {
                    currency: getCryptoCurrencyById(currencyId),
                    ...derivationRest,
                  });
                  return derivation.address;
                } finally {
                  dmk._unsafeBypassIntentQueue({ bypass: false, sessionId });
                }
              }
            : undefined,
          deprecationConfig: getDeprecationConfig(appName, dependencies),
        },
      });
      const observable = dmk.executeDeviceAction({
        sessionId,
        deviceAction,
      });
      return new ConnectAppEventMapper(dmk, sessionId, appName, observable).map();
    });
  };
}
