import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import TranslatedError from "~/components/TranslatedError";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { getDeviceModel } from "@ledgerhq/devices";

type DeviceContextInitializerComponentLWMViewProps = {
  state: EnsureAppReadyState;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled ensure app ready state: ${JSON.stringify(value)}`);
}

function formatOptional(value: string | undefined): string {
  return value ?? "none";
}

function formatDate(date: Date): string {
  return date.toISOString();
}

const MutedText = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text typography="body2" lx={{ color: "muted" }}>
      {children}
    </Text>
  );
};

function getEnsureAppReadyStateCategory(state: EnsureAppReadyState): string {
  switch (state.type) {
    case LoadingStateType.Loading:
    case LoadingStateType.InstallingApp:
      return "Loading";

    case DeviceInteractionRequiredType.UnlockDevice:
    case DeviceInteractionRequiredType.AllowSecureConnection:
    case DeviceInteractionRequiredType.ConfirmOpenApp:
      return "DeviceInteractionRequired";

    case AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking:
    case AppInteractionRequiredStateType.OutdatedAppWarning:
      return "AppInteractionRequired";

    case RetryableStateType.UserRefusedOnDevice:
    case RetryableStateType.DeviceLocked:
    case RetryableStateType.DeviceBusy:
      return "Retryable";

    case BlockingStateType.UnsupportedFirmwareVersion:
    case BlockingStateType.UnsupportedApplication:
    case BlockingStateType.UnsupportedFeature:
    case BlockingStateType.DeviceDeprecatedBlocking:
    case BlockingStateType.WrongDeviceForAccount:
    case BlockingStateType.DeviceOutOfStorageSpace:
    case BlockingStateType.DeviceNotOnboarded:
      return "Blocking";

    case FinalStateType.Error:
    case FinalStateType.Success:
      return "Final";

    default:
      return assertNever(state);
  }
}

function renderEnsureAppReadyStateDetails(state: EnsureAppReadyState): React.ReactNode {
  switch (state.type) {
    case LoadingStateType.Loading:
      return <MutedText>Loading</MutedText>;

    case LoadingStateType.InstallingApp:
      return (
        <>
          <MutedText>Installing app: {state.appName}</MutedText>
          <MutedText>
            Progress: {state.index}/{state.total} ({Math.round(state.progress * 100)}%)
          </MutedText>
        </>
      );

    case DeviceInteractionRequiredType.UnlockDevice:
      return <MutedText>Unlock device</MutedText>;

    case DeviceInteractionRequiredType.AllowSecureConnection:
      return <MutedText>Allow secure connection</MutedText>;

    case DeviceInteractionRequiredType.ConfirmOpenApp:
      return <MutedText>Confirm open app</MutedText>;

    case AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking:
      return (
        <>
          <MutedText>Device deprecated warning for {state.decision.currencyName}</MutedText>
          <MutedText>Device model: {state.decision.deviceModelId}</MutedText>
          <MutedText>Support end date: {formatDate(state.decision.supportEndDate)}</MutedText>
          <MutedText>Screens: {state.decision.screenSequence.join(", ")}</MutedText>
          <Button appearance="base" size="sm" onPress={state.onContinue}>
            Continue
          </Button>
          <DeviceDeprecationScreen
            coinName={state.decision.currencyName}
            date={state.decision.supportEndDate}
            onContinue={state.onContinue}
            productName={getDeviceModel(state.decision.deviceModelId).productName}
            screenName={
              state.decision.screenSequence.includes("warning")
                ? DeviceDeprecationScreens.warningScreen
                : DeviceDeprecationScreens.clearSigningScreen
            }
            displayClearSigningWarning={state.decision.screenSequence.includes("clearSigning")}
          />
        </>
      );

    case AppInteractionRequiredStateType.OutdatedAppWarning:
      return (
        <>
          <MutedText>Outdated app warning: {state.appName}</MutedText>
          <Button appearance="base" size="sm" onPress={state.onContinue}>
            Continue
          </Button>
        </>
      );

    case RetryableStateType.UserRefusedOnDevice:
      return (
        <>
          <MutedText>User refused on device</MutedText>
          <Button appearance="base" size="sm" onPress={state.retry}>
            Retry
          </Button>
        </>
      );

    case RetryableStateType.DeviceLocked:
      return (
        <>
          <MutedText>Device locked</MutedText>
          <Button appearance="base" size="sm" onPress={state.retry}>
            Retry
          </Button>
        </>
      );

    case RetryableStateType.DeviceBusy:
      return (
        <>
          <MutedText>Device busy, finish the action on the device</MutedText>
          <Button appearance="base" size="sm" onPress={state.retry}>
            Retry
          </Button>
        </>
      );

    case BlockingStateType.UnsupportedFirmwareVersion:
      return (
        <>
          <MutedText>Unsupported firmware version</MutedText>
          <MutedText>Current version: {formatOptional(state.updateInfo?.currentVersion)}</MutedText>
          <MutedText>Latest version: {formatOptional(state.updateInfo?.latestVersion)}</MutedText>
        </>
      );

    case BlockingStateType.UnsupportedApplication:
      return (
        <>
          <MutedText>Unsupported application: {state.appName}</MutedText>
          <MutedText>Device model: {state.deviceModelId}</MutedText>
        </>
      );

    case BlockingStateType.UnsupportedFeature:
      return <MutedText>Unsupported feature on {state.deviceModelId}</MutedText>;

    case BlockingStateType.DeviceDeprecatedBlocking:
      return (
        <>
          <MutedText>Device deprecated blocking for {state.decision.currencyName}</MutedText>
          <MutedText>Device model: {state.decision.deviceModelId}</MutedText>
          <MutedText>Support end date: {formatDate(state.decision.supportEndDate)}</MutedText>
          <DeviceDeprecationScreen
            coinName={state.decision.currencyName}
            date={state.decision.supportEndDate}
            onContinue={() => {}}
            productName={getDeviceModel(state.decision.deviceModelId).productName}
            screenName={DeviceDeprecationScreens.errorScreen}
          />
        </>
      );

    case BlockingStateType.WrongDeviceForAccount:
      return <MutedText>Wrong device for account: {state.accountName}</MutedText>;

    case BlockingStateType.DeviceOutOfStorageSpace:
      return <MutedText>Device out of storage space: {state.appNames.join(", ")}</MutedText>;

    case BlockingStateType.DeviceNotOnboarded:
      return <MutedText>Device not onboarded</MutedText>;

    case FinalStateType.Error:
      return (
        <>
          <MutedText> Error: {JSON.stringify(state.error)}</MutedText>
          <MutedText>
            Title: <TranslatedError error={state.error as Error} field="title" />
          </MutedText>
          <MutedText>
            Description: <TranslatedError error={state.error as Error} field="description" />
          </MutedText>
        </>
      );

    case FinalStateType.Success:
      return (
        <>
          <MutedText>Success</MutedText>
          <MutedText>OS version: {state.extractedContext.currentOsVersion}</MutedText>
          <MutedText>
            OS update available: {String(state.extractedContext.osUpdateAvailable)}
          </MutedText>
          <MutedText>App name: {state.extractedContext.currentAppName}</MutedText>
          <MutedText>App version: {state.extractedContext.currentAppVersion}</MutedText>
          <MutedText>
            Derived address: {formatOptional(state.extractedContext.derivedAddress)}
          </MutedText>
        </>
      );

    default:
      return assertNever(state);
  }
}

function renderEnsureAppReadyState(state: EnsureAppReadyState): React.ReactNode {
  return (
    <>
      <Text typography="body1" lx={{ color: "base" }}>
        {getEnsureAppReadyStateCategory(state)}
      </Text>
      <Text typography="body2" lx={{ color: "muted" }}>
        {state.type}
      </Text>
      {renderEnsureAppReadyStateDetails(state)}
    </>
  );
}

export function DeviceContextInitializerComponentLWMView({
  state,
}: Readonly<DeviceContextInitializerComponentLWMViewProps>) {
  return <Box lx={{ padding: "s16", gap: "s8" }}>{renderEnsureAppReadyState(state)}</Box>;
}
