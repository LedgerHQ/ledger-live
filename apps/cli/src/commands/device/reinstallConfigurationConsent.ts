import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import customLockScreenFetchHash from "@ledgerhq/live-common/hw/customLockScreenFetchHash";
import listApps from "@ledgerhq/live-common/hw/listApps";
import {
  getAppStorageInfo,
  isCustomLockScreenSupported,
  reinstallConfigurationConsent,
  ReinstallConfigArgs,
} from "@ledgerhq/device-core";
import { identifyTargetId } from "@ledgerhq/devices";
import { DeviceCommonOpts, deviceOpt } from "../../scan";
import { from, map, switchMap } from "rxjs";

export type ReinstallConfigurationConsentJobOpts = DeviceCommonOpts;

export default {
  description:
    "Consent to allow restoring state of device after a firmware update (apps, language pack, custom lock screen and app data)",
  args: [deviceOpt],
  job: ({ device }: ReinstallConfigurationConsentJobOpts) => {
    return withDevice(device || "")(t =>
      from(listApps(t)).pipe(
        map(apps => apps.filter(app => !!app.name)),
        switchMap(async apps => {
          const reinstallAppsLength = apps.length;
          let storageLength = 0;
          for (const app of apps) {
            const appStorageInfo = await getAppStorageInfo(t, app.name);
            if (appStorageInfo) {
              storageLength++;
            }
          }
          const deviceInfo = await getDeviceInfo(t);
          if (!deviceInfo.seTargetId) throw new Error("Cannot get device info");
          const deviceModel = identifyTargetId(deviceInfo.seTargetId);
          if (!deviceModel) throw new Error("Cannot get device model");

          const cls = isCustomLockScreenSupported(deviceModel.id)
            ? await customLockScreenFetchHash(t)
            : false;

          const langId = deviceInfo?.languageId ?? 0;

          const args: ReinstallConfigArgs = [
            langId > 0 ? 0x01 : 0x00,
            cls ? 0x01 : 0x00,
            reinstallAppsLength,
            storageLength,
          ];

          return args;
        }),
        switchMap(args => reinstallConfigurationConsent(t, args)),
      ),
    );
  },
};
