import { type Permission } from "react-native";
import { State as BlePlxState } from "react-native-ble-plx";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import {
  BaseDiscoveryErrorTypes,
  DiscoveryErrorTypes,
  type MobileDiscoveryError,
} from "../../types";

type DiscoveryRetry = () => Promise<true | MobileDiscoveryError>;

export const buildBluetoothPermissionPromptableError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable,
  transportId: rnBleTransportIdentifier,
  permissions,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildBluetoothPermissionManualSettingsError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings,
  transportId: rnBleTransportIdentifier,
  permissions,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildBluetoothDisabledPromptableError = (
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
  transportId: rnBleTransportIdentifier,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildBluetoothDisabledManualActionError = (
  retry: DiscoveryRetry,
  error?: unknown,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
  transportId: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildBluetoothStateError = (
  state: BlePlxState,
  retry: DiscoveryRetry,
): MobileDiscoveryError => {
  if (state === BlePlxState.Unauthorized) {
    return {
      type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings,
      transportId: rnBleTransportIdentifier,
      resolution: {
        type: "manual-action",
        retry,
      },
    };
  }

  if (state === BlePlxState.Unsupported) {
    return {
      type: DiscoveryErrorTypes.BluetoothUnsupported,
      transportId: rnBleTransportIdentifier,
      resolution: { type: "none" },
    };
  }

  return {
    type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly,
    transportId: rnBleTransportIdentifier,
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
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable,
  transportId: rnBleTransportIdentifier,
  permission: permissions[0],
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildLocationPermissionManualSettingsError = (
  permissions: Permission[],
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings,
  transportId: rnBleTransportIdentifier,
  permission: permissions[0],
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildLocationDisabledPromptableError = (
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.LocationDisabledPromptable,
  transportId: rnBleTransportIdentifier,
  resolution: {
    type: "prompt",
    retry,
  },
});

export const buildLocationDisabledManualActionError = (
  retry: DiscoveryRetry,
  error?: unknown,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.LocationDisabledManualAction,
  transportId: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "manual-action",
    retry,
  },
});

export const buildLocationServicePermissionMissingError = (
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: DiscoveryErrorTypes.LocationServicePermissionMissing,
  transportId: rnBleTransportIdentifier,
  resolution: {
    type: "check-only",
    retry,
  },
});

export const buildUnknownDiscoveryError = (
  error: unknown,
  retry: DiscoveryRetry,
): MobileDiscoveryError => ({
  type: BaseDiscoveryErrorTypes.Unknown,
  transportId: rnBleTransportIdentifier,
  error,
  resolution: {
    type: "check-only",
    retry,
  },
});
