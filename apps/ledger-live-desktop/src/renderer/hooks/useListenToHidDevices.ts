import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DescriptorEvent, DeviceModelId } from "@ledgerhq/types-devices";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { Subscription } from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    let sub: Subscription;
    function syncDevices() {
      const devices: { [key: string]: boolean } = {};

      const onDeviceEvent = ({ deviceModel, type, descriptor }: DescriptorEvent<HIDDevice>) => {
        const deviceId = typeof descriptor === "string" ? descriptor : "";
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
      };

      // Initialisation: check if there are already connected devices (listen is badly named)
      TransportWebHID.listen({ next: onDeviceEvent, error: () => {}, complete: () => {} });

      sub = new Observable(TransportWebHID.listenToConnectionEvents).subscribe(
        onDeviceEvent,
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
      clearTimeout?.(timeoutSyncDevices);
      sub?.unsubscribe?.();
    };
  }, [dispatch]);

  return null;
};
