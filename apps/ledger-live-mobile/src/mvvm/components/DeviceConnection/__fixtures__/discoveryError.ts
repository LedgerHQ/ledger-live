import {
  BaseDiscoveryErrorTypes,
  DiscoveryErrorTypes,
  rnBleTransportIdentifier,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";

export function makeDiscoveryError(type: DiscoveryError["type"]): DiscoveryError {
  const resolvable: {
    transportId: typeof rnBleTransportIdentifier;
    resolution: { type: "none" };
  } = {
    transportId: rnBleTransportIdentifier,
    resolution: { type: "none" },
  };

  switch (type) {
    case DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable:
    case DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings:
      return { ...resolvable, type, permissions: [] };
    case DiscoveryErrorTypes.LocationPermissionDeniedPromptable:
    case DiscoveryErrorTypes.LocationPermissionDeniedManualSettings:
      return { ...resolvable, type, permission: "location" };
    case DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings:
    case DiscoveryErrorTypes.BluetoothDisabledPromptable:
    case DiscoveryErrorTypes.BluetoothDisabledManualAction:
    case DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly:
    case DiscoveryErrorTypes.BluetoothUnsupported:
    case DiscoveryErrorTypes.LocationDisabledPromptable:
    case DiscoveryErrorTypes.LocationDisabledManualAction:
    case DiscoveryErrorTypes.LocationServicePermissionMissing:
      return { ...resolvable, type };
    case BaseDiscoveryErrorTypes.Unknown:
      return { type };
  }
}
