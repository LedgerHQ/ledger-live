import type {
  GetDeviceMetadataDAOutput,
  InstallOrUpdateAppsDAOutput,
  OpenAppWithDependenciesDAError,
  OpenAppWithDependenciesDAInput,
  OpenAppDARequiredInteraction,
  DeviceActionState,
  InstallPlan,
} from "@ledgerhq/device-management-kit";
import { UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";
export type ConnectAppDerivation = string;

export type ConnectAppDAOutput = {
  readonly deviceMetadata?: GetDeviceMetadataDAOutput;
  readonly installResult?: InstallOrUpdateAppsDAOutput;
  readonly derivation?: ConnectAppDerivation;
  readonly deviceDeprecation?: DeviceDeprecationRules;
};

export type ConnectAppDAInput = OpenAppWithDependenciesDAInput & {
  readonly allowMissingApplication: boolean;
  readonly requiredDerivation?: () => Promise<ConnectAppDerivation>;
  readonly deprecationConfig?: DeviceDeprecationConfigs;
};

export type DeviceDeprecationScreenRules = {
  exception?: string[];
  deprecatedFlow?: string[];
};

/**
 * Device deprecation rules computed for a specific device model.
 * This is computed from the config set in database and gives the rules to apply to the UI
 * @property warningScreenVisible: whether the warning screen should be shown
 * @property clearSigningScreenVisible: whether the warning screen when clearing signing should be shown
 * @property errorScreenVisible: whether the error screen should be shown
 * @property modelId: the device model id (e.g. "nanoS", "nanoX", "stax")
 * @property date: the date of the derecation will be effective
 * @property warningScreenRules: rules for the warning screen
 * @property errorScreenRules: rules for the error screen
 * @property clearSigningScreenRules: rules for the warning screen shown when clearing signing
 * @property onContinue: callback to call when user clicks on continue, when the screen is dismissed or when an error should be thrown
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

export type DeviceDeprecationScreenConfig = {
  date: string;
  deprecatedFlow: string[];
  exception?: string[];
};

/**
 * Device deprecation config for a specific device model.
 * This config is set in database
 * @property  deviceModelId: the device model id (e.g. "nanoS", "nanoX", "stax")
 * @property warningScreen: config for the warning screen
 * @property errorScreen: config for the error screen
 * @property warningClearSigningScreen: config for the warning screen shown when clearing signing
 */
export type DeviceDeprecationConfig = {
  deviceModelId: string;
  warningScreen: DeviceDeprecationScreenConfig;
  errorScreen: DeviceDeprecationScreenConfig;
  warningClearSigningScreen: DeviceDeprecationScreenConfig;
};

export type DeviceDeprecationConfigs = DeviceDeprecationConfig[];

export class DeviceDeprecationError extends Error {
  readonly _tag = "DeviceDeprecationError" as const;
  constructor() {
    super("device-deprecation");
    this.name = "DeviceDeprecationError";
  }
}

export type ConnectAppDAError = OpenAppWithDependenciesDAError | DeviceDeprecationError;

export enum UserInteractionRequiredLL {
  DeviceDeprecation = "device-deprecation",
}

export type ConnectAppDARequiredInteraction =
  | UserInteractionRequired.None
  | UserInteractionRequired.UnlockDevice
  | UserInteractionRequired.AllowSecureConnection
  | UserInteractionRequired.AllowListApps
  | UserInteractionRequiredLL.DeviceDeprecation
  | OpenAppDARequiredInteraction;

export type ConnectAppDAIntermediateValue = {
  requiredUserInteraction: ConnectAppDARequiredInteraction;
  installPlan: InstallPlan | null;
  deviceId?: Uint8Array;
  deviceDeprecation: DeviceDeprecationRules | undefined;
};

export type ConnectAppDAState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;
