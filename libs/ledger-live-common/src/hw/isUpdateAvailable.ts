/**
 * This covers the case where the user has the required application but we have
 * a minimum version requirement in place. For instance I may have BTC installed on version
 * 1.0.0 but we've defined that the minimum is 2.0.0.
 *
 * Up until now, all we were doing was throwing an "UpdateYourApp" error, the problem is
 * that sometimes there is no app available for that device firmware version. If there's no
 * app that fulfils the minimum version defined we are instead now throwing a fw update error.
 */
import { DeviceInfo } from "@ledgerhq/types-live";
import semver from "semver";
import { AppAndVersion } from "./connectApp";
import { mustUpgrade } from "../apps";
import { getAppsCatalogForDevice } from "../device/use-cases/getAppsCatalogForDevice";

const isUpdateAvailable = async (
  deviceInfo: DeviceInfo,
  appAndVersion: AppAndVersion,
  checkMustUpdate = true,
): Promise<boolean> => {
  const applicationsByDevice = await getAppsCatalogForDevice(deviceInfo);

  const appAvailableInProvider = applicationsByDevice.find(
    ({ versionName: name }) => appAndVersion.name === name,
  );

  if (!appAvailableInProvider) return false;

  if (!checkMustUpdate) {
    return semver.gt(appAvailableInProvider.version, appAndVersion.version);
  }

  return (
    !!appAvailableInProvider &&
    !mustUpgrade(appAvailableInProvider.versionName, appAvailableInProvider.version)
  );
};

export default isUpdateAvailable;
