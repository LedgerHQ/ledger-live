import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Subscription, Observable } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import { IPCTransport } from "../IPCTransport";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    let sub: Subscription;
    function syncDevices() {
      const devices: { [key: string]: boolean } = {};

      sub = new Observable(IPCTransport.listen).subscribe(
        ({ device, deviceModel, type, descriptor }) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: deviceModel ? deviceModel.id : DeviceModelId.nanoS,
              wired: true,
            };

            if (type === "add") {
              devices[deviceId] = true;
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              delete devices[deviceId];
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        () => {
          resetDevices();
          syncDevices();
        },
        () => {
          resetDevices();
          syncDevices();
        },
      );
    }

    const timeoutSyncDevices = setTimeout(syncDevices, 1000);

    return () => {
      clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
    };
  }, [dispatch]);

  return null;
};
