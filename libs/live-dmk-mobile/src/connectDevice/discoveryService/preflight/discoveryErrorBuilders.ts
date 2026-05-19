import { type Permission } from "react-native";
import { State as BlePlxState } from "react-native-ble-plx";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { DiscoveryErrors, type DiscoveryError } from "../../types";

type DiscoveryRetry = () => Promise<true | DiscoveryError>;

export const buildBluetoothPermissionPromptableError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.BluetoothPermissionDeniedPromptable,
  transportID: rnBleTransportIdentifier,
  permissions,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildBluetoothPermissionManualSettingsError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.BluetoothPermissionDeniedManualSettings,
  transportID: rnBleTransportIdentifier,
  permissions,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildBluetoothDisabledPromptableError = (retry: DiscoveryRetry): DiscoveryError => ({
  type: DiscoveryErrors.BluetoothDisabledPromptable,
  transportID: rnBleTransportIdentifier,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildBluetoothDisabledManualActionError = (
  retry: DiscoveryRetry,
  error?: unknown,
): DiscoveryError => ({
  type: DiscoveryErrors.BluetoothDisabledManualAction,
  transportID: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildBluetoothStateError = (
  state: BlePlxState,
  retry: DiscoveryRetry,
): DiscoveryError => {
  if (state === BlePlxState.Unauthorized) {
    return {
      type: DiscoveryErrors.BluetoothPermissionUnauthorizedManualSettings,
      transportID: rnBleTransportIdentifier,
      resolution: {
        type: "manual-action",
        retry,
      },
    };
  }

  if (state === BlePlxState.Unsupported) {
    return {
      type: DiscoveryErrors.BluetoothUnsupported,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "none" },
    };
  }

  return {
    type: DiscoveryErrors.BluetoothStateUnknownCheckOnly,
    transportID: rnBleTransportIdentifier,
    state,
    resolution: {
      type: "check-only",
      retry,
    },
  };
};

export const buildLocationPermissionPromptableError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.LocationPermissionDeniedPromptable,
  transportID: rnBleTransportIdentifier,
  permission: permissions[0],
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildLocationPermissionManualSettingsError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.LocationPermissionDeniedManualSettings,
  transportID: rnBleTransportIdentifier,
  permission: permissions[0],
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildLocationDisabledPromptableError = (retry: DiscoveryRetry): DiscoveryError => ({
  type: DiscoveryErrors.LocationDisabledPromptable,
  transportID: rnBleTransportIdentifier,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildLocationDisabledManualActionError = (
  retry: DiscoveryRetry,
  error?: unknown,
): DiscoveryError => ({
  type: DiscoveryErrors.LocationDisabledManualAction,
  transportID: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildLocationServicePermissionMissingError = (
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.LocationServicePermissionMissing,
  transportID: rnBleTransportIdentifier,
  resolution: {
    type: "check-only",
    retry,
  },
});

export const buildUnknownDiscoveryError = (
  error: unknown,
  retry: DiscoveryRetry,
): DiscoveryError => ({
  type: DiscoveryErrors.Unknown,
  transportID: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "check-only",
    retry,
  },
});
