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
  readonly deviceDeprecation?: DeviceDeprecationPayload;
};

export type ConnectAppDAInput = OpenAppWithDependenciesDAInput & {
  readonly allowMissingApplication: boolean;
  readonly requiredDerivation?: () => Promise<ConnectAppDerivation>;
  readonly deprecationConfig?: DeviceDeprecated;
};

export type DeviceDeprecationConfig = {
  exception?: string[];
  deprecatedFlow?: string[];
};

export type DeviceDeprecationPayload = {
  warningScreenVisible: boolean;
  clearSigningScreenVisible: boolean;
  errorScreenVisible: boolean;
  modelId: LLDeviceModelId;
  date: Date;
  warningScreenConfig?: DeviceDeprecationConfig;
  clearSigningScreenConfig?: DeviceDeprecationConfig;
  errorScreenConfig?: DeviceDeprecationConfig;
  onContinue: (isError?: boolean) => void;
};

type DeprecationScreen = {
  date: string;
  deprecatedFlow: string[];
  exception?: string[];
};

export type DeviceDeprecatedEntry = {
  deviceModelId: string;
  infoScreen: DeprecationScreen;
  errorScreen: DeprecationScreen;
  warningClearSigningScreen: DeprecationScreen;
};

export type DeviceDeprecated = DeviceDeprecatedEntry[];

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
  deviceDeprecation: DeviceDeprecationPayload | undefined;
};

export type ConnectAppDAState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;
