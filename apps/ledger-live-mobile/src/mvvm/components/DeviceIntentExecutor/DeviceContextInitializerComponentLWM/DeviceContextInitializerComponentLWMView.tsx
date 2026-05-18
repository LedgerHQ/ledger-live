import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceContextInitializerComponentLWMViewProps } from "./types";
import { LoadingState } from "./components/LoadingState";
import { InstallingAppState } from "./components/InstallingAppState";
import { UnlockDeviceState } from "./components/UnlockDeviceState";
import { AllowSecureConnectionState } from "./components/AllowSecureConnectionState";
import { ConfirmOpenAppState } from "./components/ConfirmOpenAppState";
import { DeviceDeprecatedNonBlockingState } from "./components/DeviceDeprecatedNonBlockingState";
import { OutdatedAppWarning } from "./components/OutdatedAppWarning";
import { RetryableDeviceLockedState } from "./components/RetryableDeviceLockedState";
import { UserRefusedOnDeviceState } from "./components/UserRefusedOnDeviceState";
import { DeviceBusyState } from "./components/DeviceBusyState";
import { UnsupportedFirmwareVersion } from "./components/UnsupportedFirmwareVersion";
import { UnsupportedApplication } from "./components/UnsupportedApplication";
import { UnsupportedFeature } from "./components/UnsupportedFeature";
import { DeviceDeprecatedBlockingState } from "./components/DeviceDeprecatedBlockingState";
import { WrongDeviceForAccount } from "./components/WrongDeviceForAccount";
import { DeviceOutOfStorageSpace } from "./components/DeviceOutOfStorageSpace";
import { DeviceNotOnboarded } from "./components/DeviceNotOnboarded";
import { FinalError } from "./components/FinalError";

function assertNever(value: never): never {
  throw new Error(`Unhandled ensure app ready state: ${JSON.stringify(value)}`);
}

export function DeviceContextInitializerComponentLWMView({
  state,
  device,
  onCancel,
}: Readonly<DeviceContextInitializerComponentLWMViewProps>) {
  const commonProps = { device, onCancel } as const;

  return (
    <Box lx={rootStyle}>
      {(() => {
        switch (state.type) {
          case LoadingStateType.Loading:
            return <LoadingState />;
          case LoadingStateType.InstallingApp:
            return <InstallingAppState />;
          case DeviceInteractionRequiredType.UnlockDevice:
            return <UnlockDeviceState state={state} {...commonProps} />;
          case DeviceInteractionRequiredType.AllowSecureConnection:
            return <AllowSecureConnectionState state={state} {...commonProps} />;
          case DeviceInteractionRequiredType.ConfirmOpenApp:
            return <ConfirmOpenAppState state={state} {...commonProps} />;
          case AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking:
            return <DeviceDeprecatedNonBlockingState state={state} {...commonProps} />;
          case AppInteractionRequiredStateType.OutdatedAppWarning:
            return <OutdatedAppWarning state={state} {...commonProps} />;
          case RetryableStateType.UserRefusedOnDevice:
            return <UserRefusedOnDeviceState state={state} {...commonProps} />;
          case RetryableStateType.DeviceLocked:
            return <RetryableDeviceLockedState state={state} {...commonProps} />;
          case RetryableStateType.DeviceBusy:
            return <DeviceBusyState state={state} {...commonProps} />;
          case BlockingStateType.UnsupportedFirmwareVersion:
            return <UnsupportedFirmwareVersion state={state} {...commonProps} />;
          case BlockingStateType.UnsupportedApplication:
            return <UnsupportedApplication state={state} {...commonProps} />;
          case BlockingStateType.UnsupportedFeature:
            return <UnsupportedFeature state={state} {...commonProps} />;
          case BlockingStateType.DeviceDeprecatedBlocking:
            return <DeviceDeprecatedBlockingState state={state} {...commonProps} />;
          case BlockingStateType.WrongDeviceForAccount:
            return <WrongDeviceForAccount state={state} {...commonProps} />;
          case BlockingStateType.DeviceOutOfStorageSpace:
            return <DeviceOutOfStorageSpace state={state} {...commonProps} />;
          case BlockingStateType.DeviceNotOnboarded:
            return <DeviceNotOnboarded state={state} {...commonProps} />;
          case FinalStateType.Error:
            return <FinalError state={state} {...commonProps} />;
          case FinalStateType.Success:
            return null;
          default:
            return assertNever(state);
        }
      })()}
    </Box>
  );
}

const rootStyle = {
  width: "full",
} as const;
