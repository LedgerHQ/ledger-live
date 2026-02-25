import { useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Subscription, Observable } from "rxjs";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useDeviceManagementKit, DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;

  const deviceManagementKit = useDeviceManagementKit();

  useEffect(() => {
    let sub: Subscription;

    const dmkListen = isLdmkConnectAppEnabled
      ? DeviceManagementKitTransport.listen
      : DeviceManagementKitTransport.listenLegacyConnectApp;

    function syncDevicesWithDmk() {
      sub = new Observable(dmkListen).subscribe({
        next: ({ descriptor, device, deviceModel, type }) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: deviceModel ? deviceModel.id : DeviceModelId.nanoS,
              // TODO: Update the Transport.listen type whenever we switch to LDMK
              // @ts-expect-error remapping type
              wired: deviceModel?.type === "USB",
            };
            if (type === "add") {
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        error: () => {
          resetDevices();
          syncDevicesWithDmk();
        },
        complete: () => {
          resetDevices();
          syncDevicesWithDmk();
        },
      });
    }

    // Always use DeviceManagementKit for device listening (WebHID)
    const fn = syncDevicesWithDmk;

    const timeoutSyncDevices = setTimeout(fn, 1000);

    return () => {
      console.log("[[useListenToHidDevices]] cleanup");
      clearTimeout?.(timeoutSyncDevices);
      sub?.unsubscribe?.();
    };
  }, [dispatch, deviceManagementKit, isLdmkConnectAppEnabled]);

  return null;
};
