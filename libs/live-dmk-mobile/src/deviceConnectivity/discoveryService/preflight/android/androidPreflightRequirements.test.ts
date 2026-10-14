import { PermissionsAndroid } from "react-native";
import { getAndroidPreflightRequirements } from "./androidPreflightRequirements";

jest.mock("react-native", () => ({
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_COARSE_LOCATION: "android.permission.ACCESS_COARSE_LOCATION",
      ACCESS_FINE_LOCATION: "android.permission.ACCESS_FINE_LOCATION",
      BLUETOOTH_CONNECT: "android.permission.BLUETOOTH_CONNECT",
      BLUETOOTH_SCAN: "android.permission.BLUETOOTH_SCAN",
    },
  },
  Platform: {
    Version: 31,
  },
}));

const { PERMISSIONS } = PermissionsAndroid;

describe("androidPreflightRequirements", () => {
  it("GIVEN Android API 28, WHEN getting requirements, THEN it should require coarse location checks", () => {
    // GIVEN
    const apiLevel = 28;

    // WHEN
    const requirements = getAndroidPreflightRequirements(apiLevel);

    // THEN
    expect(requirements).toMatchObject({
      sdk: "lte28",
      checks: ["bluetooth-service", "location-permission", "location-service"],
      bluetoothPermissions: [],
      locationPermission: PERMISSIONS.ACCESS_COARSE_LOCATION,
    });
    expect(requirements.matches(28)).toBe(true);
    expect(requirements.matches(29)).toBe(false);
  });

  it("GIVEN Android API 29 string, WHEN getting requirements, THEN it should require fine location checks", () => {
    // GIVEN
    const apiLevel = "29";

    // WHEN
    const requirements = getAndroidPreflightRequirements(apiLevel);

    // THEN
    expect(requirements).toMatchObject({
      sdk: "29-30",
      checks: ["bluetooth-service", "location-permission", "location-service"],
      bluetoothPermissions: [],
      locationPermission: PERMISSIONS.ACCESS_FINE_LOCATION,
    });
    expect(requirements.matches(29)).toBe(true);
    expect(requirements.matches(31)).toBe(false);
  });

  it("GIVEN Android API 30, WHEN getting requirements, THEN it should require fine location checks", () => {
    // GIVEN
    const apiLevel = 30;

    // WHEN
    const requirements = getAndroidPreflightRequirements(apiLevel);

    // THEN
    expect(requirements).toMatchObject({
      sdk: "29-30",
      checks: ["bluetooth-service", "location-permission", "location-service"],
      bluetoothPermissions: [],
      locationPermission: PERMISSIONS.ACCESS_FINE_LOCATION,
    });
    expect(requirements.matches(30)).toBe(true);
    expect(requirements.matches(28)).toBe(false);
  });

  it("GIVEN Android API 31, WHEN getting requirements, THEN it should require Bluetooth permissions", () => {
    // GIVEN
    const apiLevel = 31;

    // WHEN
    const requirements = getAndroidPreflightRequirements(apiLevel);

    // THEN
    expect(requirements).toMatchObject({
      sdk: "gte31",
      checks: ["bluetooth-permission", "bluetooth-service"],
      bluetoothPermissions: [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT],
      locationPermission: null,
    });
    expect(requirements.matches(31)).toBe(true);
    expect(requirements.matches(30)).toBe(false);
  });

  it("GIVEN no explicit platform version, WHEN getting requirements, THEN it should use Platform.Version", () => {
    // GIVEN / WHEN
    const requirements = getAndroidPreflightRequirements();

    // THEN
    expect(requirements).toMatchObject({
      sdk: "gte31",
      checks: ["bluetooth-permission", "bluetooth-service"],
    });
  });

  it("GIVEN an unknown platform version, WHEN getting requirements, THEN it should fallback to latest requirements", () => {
    // GIVEN
    const apiLevel = "unknown";

    // WHEN
    const requirements = getAndroidPreflightRequirements(apiLevel);

    // THEN
    expect(requirements).toMatchObject({
      sdk: "gte31",
      checks: ["bluetooth-permission", "bluetooth-service"],
    });
  });
});
