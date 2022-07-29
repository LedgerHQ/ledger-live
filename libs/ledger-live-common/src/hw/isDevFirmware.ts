/**
 * In order to mitigate users on odd firmware versions reporting
 * connectivity errors when interacting with the app. Attempt to detect
 * those versions and set a flag for UI.
 */
const isDevFirmware = (seVersion: string | undefined): boolean => {
  if (!seVersion) return false;

  const knownDevSuffixes = ["lo", "rc", "il", "tr"]; // FW can't guarantee non digits in versions
  return knownDevSuffixes.some((suffix) => seVersion.includes("-" + suffix));
};

export default isDevFirmware;
