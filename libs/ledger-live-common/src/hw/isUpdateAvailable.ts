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
import { identifyTargetId, DeviceModelId } from "@ledgerhq/devices";
import semver from "semver";
import { getProviderId } from "../manager/provider";
import ManagerAPI from "../api/Manager";
import { AppAndVersion } from "./connectApp";
import { mustUpgrade } from "../apps";

const isUpdateAvailable = async (
  deviceInfo: DeviceInfo,
  appAndVersion: AppAndVersion,
  checkMustUpdate = true
): Promise<boolean> => {
  const deviceModel = identifyTargetId(deviceInfo.targetId as number);

  const deviceVersionP = ManagerAPI.getDeviceVersion(
    deviceInfo.targetId,
    getProviderId(deviceInfo)
  );

  const firmwareDataP = deviceVersionP.then((deviceVersion) =>
    ManagerAPI.getCurrentFirmware({
      deviceId: deviceVersion.id,
      version: deviceInfo.version,
      provider: getProviderId(deviceInfo),
    })
  );

  const applicationsByDevice = await Promise.all([
    deviceVersionP,
    firmwareDataP,
  ]).then(([deviceVersion, firmwareData]) =>
    ManagerAPI.applicationsByDevice({
      provider: getProviderId(deviceInfo),
      current_se_firmware_final_version: firmwareData.id,
      device_version: deviceVersion.id,
    })
  );

  const appAvailableInProvider = applicationsByDevice.find(
    ({ name }) => appAndVersion.name === name
  );

  if (!appAvailableInProvider) return false;

  if (!checkMustUpdate) {
    return semver.gt(appAvailableInProvider.version, appAndVersion.version);
  }

  return (
    !!appAvailableInProvider &&
    !mustUpgrade(
      deviceModel?.id as DeviceModelId,
      appAvailableInProvider.name,
      appAvailableInProvider.version
    )
  );
};

export default isUpdateAvailable;
