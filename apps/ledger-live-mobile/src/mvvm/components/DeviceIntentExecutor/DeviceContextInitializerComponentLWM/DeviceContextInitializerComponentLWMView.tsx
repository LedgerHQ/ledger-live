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

function StateLine({ state, children }: { state: EnsureAppReadyState; children: React.ReactNode }) {
  return (
    <Text typography="body2" lx={{ color: "muted" }}>
      [{String(state.type)}] {children}
    </Text>
  );
}

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
      return <StateLine state={state}>Loading</StateLine>;

    case LoadingStateType.InstallingApp:
      return (
        <>
          <StateLine state={state}>Installing app: {state.appName}</StateLine>
          <StateLine state={state}>
            Progress: {state.index}/{state.total} ({Math.round(state.progress * 100)}%)
          </StateLine>
        </>
      );

    case DeviceInteractionRequiredType.UnlockDevice:
      return <StateLine state={state}>Unlock device</StateLine>;

    case DeviceInteractionRequiredType.AllowSecureConnection:
      return <StateLine state={state}>Allow secure connection</StateLine>;

    case DeviceInteractionRequiredType.ConfirmOpenApp:
      return <StateLine state={state}>Confirm open app</StateLine>;

    case AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking:
      return (
        <>
          <StateLine state={state}>
            Device deprecated warning for {state.decision.currencyName}
          </StateLine>
          <StateLine state={state}>Device model: {state.decision.deviceModelId}</StateLine>
          <StateLine state={state}>
            Support end date: {formatDate(state.decision.supportEndDate)}
          </StateLine>
          <StateLine state={state}>Screens: {state.decision.screenSequence.join(", ")}</StateLine>
          <Button appearance="base" size="sm" onPress={state.onContinue}>
            Continue
          </Button>
        </>
      );

    case AppInteractionRequiredStateType.OutdatedAppWarning:
      return (
        <>
          <StateLine state={state}>Outdated app warning: {state.appName}</StateLine>
          <Button appearance="base" size="sm" onPress={state.onContinue}>
            Continue
          </Button>
        </>
      );

    case RetryableStateType.UserRefusedOnDevice:
      return <StateLine state={state}>User refused on device</StateLine>;

    case RetryableStateType.DeviceLocked:
      return <StateLine state={state}>Device locked</StateLine>;

    case BlockingStateType.UnsupportedFirmwareVersion:
      return (
        <>
          <StateLine state={state}>Unsupported firmware version</StateLine>
          <StateLine state={state}>
            Current version: {formatOptional(state.updateInfo?.currentVersion)}
          </StateLine>
          <StateLine state={state}>
            Latest version: {formatOptional(state.updateInfo?.latestVersion)}
          </StateLine>
        </>
      );

    case BlockingStateType.UnsupportedApplication:
      return (
        <>
          <StateLine state={state}>Unsupported application: {state.appName}</StateLine>
          <StateLine state={state}>Device model: {state.deviceModelId}</StateLine>
        </>
      );

    case BlockingStateType.UnsupportedFeature:
      return <StateLine state={state}>Unsupported feature on {state.deviceModelId}</StateLine>;

    case BlockingStateType.DeviceDeprecatedBlocking:
      return (
        <>
          <StateLine state={state}>
            Device deprecated blocking for {state.decision.currencyName}
          </StateLine>
          <StateLine state={state}>Device model: {state.decision.deviceModelId}</StateLine>
          <StateLine state={state}>
            Support end date: {formatDate(state.decision.supportEndDate)}
          </StateLine>
        </>
      );

    case BlockingStateType.WrongDeviceForAccount:
      return <StateLine state={state}>Wrong device for account: {state.accountName}</StateLine>;

    case BlockingStateType.DeviceOutOfStorageSpace:
      return (
        <StateLine state={state}>
          Device out of storage space: {state.appNames.join(", ")}
        </StateLine>
      );

    case BlockingStateType.DeviceNotOnboarded:
      return <StateLine state={state}>Device not onboarded</StateLine>;

    case FinalStateType.Error:
      return <StateLine state={state}>Error: {String(state.error)}</StateLine>;

    case FinalStateType.Success:
      return (
        <>
          <StateLine state={state}>Success</StateLine>
          <StateLine state={state}>OS version: {state.extractedContext.currentOsVersion}</StateLine>
          <StateLine state={state}>
            OS update available: {String(state.extractedContext.osUpdateAvailable)}
          </StateLine>
          <StateLine state={state}>App name: {state.extractedContext.currentAppName}</StateLine>
          <StateLine state={state}>
            App version: {state.extractedContext.currentAppVersion}
          </StateLine>
          <StateLine state={state}>
            Derived address: {formatOptional(state.extractedContext.derivedAddress)}
          </StateLine>
        </>
      );

    default:
      return assertNever(state);
  }
}

function renderEnsureAppReadyState(state: EnsureAppReadyState): React.ReactNode {
  return (
    <>
      <StateLine state={state}>Category: {getEnsureAppReadyStateCategory(state)}</StateLine>
      {renderEnsureAppReadyStateDetails(state)}
    </>
  );
}

export function DeviceContextInitializerComponentLWMView({
  state,
}: DeviceContextInitializerComponentLWMViewProps) {
  return <Box lx={{ padding: "s16", gap: "s8" }}>{renderEnsureAppReadyState(state)}</Box>;
}
