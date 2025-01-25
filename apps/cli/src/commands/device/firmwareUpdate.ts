import invariant from "invariant";
import { from, of, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { UnknownMCU } from "@ledgerhq/errors";
import ManagerAPI from "@ledgerhq/live-common/manager/api";
import { fetchMcusUseCase } from "@ledgerhq/live-common/device/use-cases/fetchMcusUseCase";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import { getProviderId } from "@ledgerhq/live-common/manager/provider";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import prepareFirmwareUpdate from "@ledgerhq/live-common/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/hw/firmwareUpdate-main";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

const listFirmwareOSU = async () => {
  const { data } = await network({
    method: "GET",
    url: `${getEnv("MANAGER_API_BASE")}/firmware_osu_versions`,
  });
  return data;
};

const customGetLatestFirmwareForDevice = async (
  deviceInfo: DeviceInfo,
  osuVersion: string,
): Promise<FirmwareUpdateContext | null | undefined> => {
  const mcusPromise = fetchMcusUseCase();
  // Get device infos from targetId
  const deviceVersion = await ManagerAPI.getDeviceVersion(
    deviceInfo.targetId,
    getProviderId(deviceInfo),
  );
  let osu;

  if (deviceInfo.isOSU) {
    osu = await ManagerAPI.getCurrentOSU({
      deviceId: deviceVersion.id,
      provider: getProviderId(deviceInfo),
      version: deviceInfo.version,
    });
  } else {
    const data = await listFirmwareOSU();
    osu = data.find(
      (d: any) => d.device_versions.includes(deviceVersion.id) && d.name === osuVersion,
    );
  }

  if (!osu) {
    return null;
  }

  const final = await ManagerAPI.getFinalFirmwareById(osu.next_se_firmware_final_version);
  const mcus = await mcusPromise;
  const currentMcuVersion = mcus.find(mcu => mcu.name === deviceInfo.mcuVersion);
  if (!currentMcuVersion) throw new UnknownMCU();
  const shouldFlashMCU = !final.mcu_versions.includes(currentMcuVersion.id);
  return {
    final,
    osu,
    shouldFlashMCU,
  };
};

const disclaimer =
  "this is a developer feature that allow to flash anything, we are not responsible of your actions, by flashing your device you might reset your seed or block your device";

export type FirmwareUpdateJobOpts = DeviceCommonOpts & {
  "to-my-own-risk"?: boolean;
  osuVersion: string;
  listOSUs: boolean;
};

export default {
  description: "Perform a firmware update",
  args: [
    deviceOpt,
    {
      name: "to-my-own-risk",
      type: Boolean,
      desc: disclaimer,
    },
    {
      name: "osuVersion",
      type: String,
      desc: "(to your own risk) provide yourself an OSU version to flash the device with",
    },
    {
      name: "listOSUs",
      type: Boolean,
      desc: "list all available OSUs (for all devices, beta and prod versions)",
    },
  ],
  job: ({
    device,
    osuVersion,
    "to-my-own-risk": toMyOwnRisk,
    listOSUs,
  }: Partial<FirmwareUpdateJobOpts>) => (
    invariant(!osuVersion || toMyOwnRisk, "--to-my-own-risk is required: " + disclaimer),
    listOSUs
      ? from(listFirmwareOSU()).pipe(mergeMap(d => from(d.map((d: any) => d.name))))
      : withDevice(device || "")(t => from(getDeviceInfo(t))).pipe(
          mergeMap(
            osuVersion
              ? deviceInfo => customGetLatestFirmwareForDevice(deviceInfo, osuVersion)
              : deviceInfo => getLatestFirmwareForDeviceUseCase(deviceInfo),
          ),
          mergeMap(firmware => {
            if (!firmware) return of("already up to date");
            return concat(
              of(
                `firmware: ${firmware.final.name}\nOSU: ${firmware.osu.name} (hash: ${firmware.osu.hash})`,
              ),
              prepareFirmwareUpdate(device || "", firmware),
              mainFirmwareUpdate(device || "", firmware),
            );
          }),
        )
  ),
};
