import { useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Subscription, Observable } from "rxjs";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let sub: Subscription;

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

    const timeoutSyncDevices = setTimeout(syncDevicesWithDmk, 1000);

    return () => {
      console.log("[[useListenToHidDevices]] cleanup");
      clearTimeout?.(timeoutSyncDevices);
      sub?.unsubscribe?.();
    };
  }, [dispatch]);

  return null;
};
