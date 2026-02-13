import { execSync } from "node:child_process";

const android = "Android";
const ios = "iOS";

export const getDeviceOS = (): string => {
  const config = process.env.DETOX_CONFIGURATION || "";
  const lowerConfig = config.toLowerCase();
  if (lowerConfig.includes("ios")) return ios;
  if (lowerConfig.includes("android")) return android;
  return "";
};

/**
 * Retrieves the Android version of the first connected device or emulator using ADB.
 * @returns {string} The version string (e.g., "13") or an empty string if not found.
 */
export const getAndroidVersion = (): string => {
  try {
    const devicesOutput = execSync("adb devices", { encoding: "utf8" });
    const lines = devicesOutput
      .split("\n")
      .filter(line => line.trim().length > 0 && !line.startsWith("List of devices"));

    if (lines.length > 0) {
      const deviceId = lines[0].split(/\s+/)[0];
      if (deviceId) {
        const version = execSync(`adb -s ${deviceId} shell getprop ro.build.version.release`, {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        return version;
      }
    }
  } catch (error) {
    console.warn("Error fetching Android version:", error);
  }
  return "";
};

/**
 * Retrieves the iOS version of the currently booted simulator using xcrun simctl.
 * @returns {string} The version string (e.g., "17.2") or an empty string if not found.
 */
export const getIOSVersion = (): string => {
  try {
    const jsonOutput = execSync("xcrun simctl list devices available --json", {
      encoding: "utf8",
    });
    const data = JSON.parse(jsonOutput);
    const devices = data.devices;

    for (const runtimeKey of Object.keys(devices)) {
      const bootedDevice = devices[runtimeKey].find((d: any) => d.state === "Booted");

      if (bootedDevice) {
        const versionMatch = runtimeKey.match(/iOS[-. ](\d+)[-.](\d+)/i);
        if (versionMatch) {
          return `${versionMatch[1]}.${versionMatch[2]}`;
        }
      }
    }
  } catch (error) {
    console.warn("Error fetching iOS version:", error);
  }
  return "";
};

/**
 * Gets the OS version of the current test device based on the DETOX_CONFIGURATION.
 * @returns {string} The OS version string or an empty string if not found.
 */
export const getDeviceVersion = (): string => {
  const os = getDeviceOS();

  if (os === android) {
    return getAndroidVersion();
  } else if (os === ios) {
    return getIOSVersion();
  }
  return "";
};
