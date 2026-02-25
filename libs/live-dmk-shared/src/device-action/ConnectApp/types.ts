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

export type ConnectAppDerivation = string;

export type ConnectAppDAOutput = {
  readonly deviceMetadata?: GetDeviceMetadataDAOutput;
  readonly installResult?: InstallOrUpdateAppsDAOutput;
  readonly derivation?: ConnectAppDerivation;
};

export type ConnectAppDAInput = OpenAppWithDependenciesDAInput & {
  readonly allowMissingApplication: boolean;
  readonly requiredDerivation?: () => Promise<ConnectAppDerivation>;
};

export type ConnectAppDAError = OpenAppWithDependenciesDAError;

export type ConnectAppDARequiredInteraction =
  | UserInteractionRequired.None
  | UserInteractionRequired.UnlockDevice
  | UserInteractionRequired.AllowSecureConnection
  | UserInteractionRequired.AllowListApps
  | OpenAppDARequiredInteraction;

export type ConnectAppDAIntermediateValue = {
  requiredUserInteraction: ConnectAppDARequiredInteraction;
  installPlan: InstallPlan | null;
  deviceId?: Uint8Array;
};

export type ConnectAppDAState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;
