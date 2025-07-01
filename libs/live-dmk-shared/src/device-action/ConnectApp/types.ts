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
  readonly appConfig?: any;
};

export type DeviceDeprecationConfig = {
  tokenExceptions?: string[];
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
  onContinue: (value?: string) => void;
};

export type ConnectAppDAError = OpenAppWithDependenciesDAError;

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
