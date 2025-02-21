import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Subscription, Observable } from "rxjs";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useDeviceManagementKit, DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { IPCTransport } from "~/renderer/IPCTransport";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  const ldmkFeatureFlag = useFeature("ldmkTransport");

  const deviceManagementKit = useDeviceManagementKit();

  console.log("deviceManagementKit", deviceManagementKit.close);

  useEffect(() => {
    let sub: Subscription;

    function syncDevices() {
      sub = new Observable(IPCTransport.listen).subscribe({
        next: ({ device, deviceModel, type, descriptor }) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: deviceModel ? deviceModel.id : DeviceModelId.nanoS,
              wired: true,
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
          syncDevices();
        },
        complete: () => {
          resetDevices();
          syncDevices();
        },
      });
    }

    function syncDevicesWithDmk() {
      sub = new Observable(DeviceManagementKitTransport.listen).subscribe({
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

    const fn = ldmkFeatureFlag?.enabled ? syncDevicesWithDmk : syncDevices;

    const timeoutSyncDevices = setTimeout(fn, 1000);

    return () => {
      console.log("[[useListenToHidDevices]] cleanup");
      clearTimeout?.(timeoutSyncDevices);
      sub?.unsubscribe?.();
    };
  }, [dispatch, deviceManagementKit, ldmkFeatureFlag?.enabled]);

  return null;
};
