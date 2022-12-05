import { Permission, PermissionsAndroid, Platform } from "react-native";

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

/**
 * https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#declare
 */

export const locationPermission: Permission | undefined =
  Platform.OS === "android"
    ? Platform.Version <= 28
      ? PERMISSIONS.ACCESS_COARSE_LOCATION
      : PERMISSIONS.ACCESS_FINE_LOCATION
    : undefined;

export const bluetoothPermissions: Permission[] =
  Platform.OS === "android"
    ? Platform.Version < 31
      ? []
      : [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT]
    : [];

export async function checkLocationPermission() {
  if (!locationPermission) return true;
  return PermissionsAndroid.check(locationPermission);
}

export type RequestResult = {
  granted: boolean;
  status: typeof RESULTS[number];
};

export async function requestLocationPermission(): Promise<RequestResult> {
  if (!locationPermission) return { granted: true, status: RESULTS.GRANTED };
  return PermissionsAndroid.request(locationPermission).then(status => {
    return {
      granted: status === RESULTS.GRANTED,
      status,
    };
  });
}

export async function checkBluetoothPermissions() {
  if (bluetoothPermissions.length === 0) return true;
  return Promise.all(
    bluetoothPermissions.map(permission =>
      PermissionsAndroid.check(permission),
    ),
  ).then(results => results.every(res => res));
}

export type RequestMultipleResult = {
  allGranted: boolean;
  generalStatus: typeof PermissionsAndroid.RESULTS[number];
};

export async function requestBluetoothPermissions(): Promise<RequestMultipleResult> {
  if (bluetoothPermissions.length === 0)
    return { allGranted: true, generalStatus: RESULTS.GRANTED };
  return PermissionsAndroid.requestMultiple(bluetoothPermissions).then(res => {
    const permissionStatuses = Object.values(res);
    const allGranted = permissionStatuses.every(
      status => status === RESULTS.GRANTED,
    );

    /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
    const someNeverAskAgain = permissionStatuses.some(
      status => status === RESULTS.NEVER_ASK_AGAIN,
    );

    return {
      allGranted,
      generalStatus: allGranted
        ? RESULTS.GRANTED
        : someNeverAskAgain
        ? RESULTS.NEVER_ASK_AGAIN
        : RESULTS.DENIED,
    };
  });
}
