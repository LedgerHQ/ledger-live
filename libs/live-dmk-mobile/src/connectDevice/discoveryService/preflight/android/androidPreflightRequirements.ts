import { PermissionsAndroid, Platform, type Permission } from "react-native";

const { PERMISSIONS } = PermissionsAndroid;

export type AndroidPreflightCheckId =
  | "bluetooth-permission"
  | "bluetooth-service"
  | "location-permission"
  | "location-service";

export type AndroidPreflightRequirements = {
  sdk: string;
  matches: (version: number) => boolean;
  checks: AndroidPreflightCheckId[];
  bluetoothPermissions: Permission[];
  locationPermission: Permission | null;
};

const androidPreflightRequirements: AndroidPreflightRequirements[] = [
  {
    sdk: "lte28",
    matches: version => version <= 28,
    checks: ["bluetooth-service", "location-permission", "location-service"],
    bluetoothPermissions: [],
    locationPermission: PERMISSIONS.ACCESS_COARSE_LOCATION,
  },
  {
    sdk: "29-30",
    matches: version => version >= 29 && version <= 30,
    checks: ["bluetooth-service", "location-permission", "location-service"],
    bluetoothPermissions: [],
    locationPermission: PERMISSIONS.ACCESS_FINE_LOCATION,
  },
  {
    sdk: "gte31",
    matches: version => version >= 31,
    checks: ["bluetooth-permission", "bluetooth-service"],
    bluetoothPermissions: [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT],
    locationPermission: null,
  },
];

export const getAndroidPreflightRequirements = (
  platformVersion: string | number = Platform.Version,
): AndroidPreflightRequirements => {
  const version = typeof platformVersion === "number" ? platformVersion : Number(platformVersion);
  const requirements = androidPreflightRequirements.find(candidate => candidate.matches(version));

  return requirements ?? androidPreflightRequirements[androidPreflightRequirements.length - 1];
};
