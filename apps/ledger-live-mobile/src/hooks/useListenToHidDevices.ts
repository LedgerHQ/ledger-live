import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Observable, Subscription } from "rxjs";
import { DescriptorEvent, DeviceModelId } from "@ledgerhq/types-devices";
import HIDTransport from "@ledgerhq/react-native-hid";
import { map } from "rxjs/operators";
import { setWiredDevice } from "../actions/appstate";
import { DeviceLike } from "../reducers/types";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let sub: Subscription;
    function syncDevices() {
      sub = new Observable<DescriptorEvent<DeviceLike | null>>(o =>
        HIDTransport.listen(o),
      )
        .pipe(
          map(({ type, descriptor, deviceModel }) =>
            type === "add"
              ? {
                  id: `usb|${JSON.stringify(descriptor)}`,
                  modelId: deviceModel?.id || DeviceModelId.nanoS,
                  name: deviceModel?.productName ?? "",
                }
              : null,
          ),
        )
        .subscribe({
          next: (wiredDevice: DeviceLike | null) => {
            dispatch(setWiredDevice(wiredDevice));
          },
          error: () => {
            syncDevices();
          },
          complete: () => {
            syncDevices();
          },
        });
    }

    const timeoutSyncDevices = setTimeout(syncDevices, 1000);

    return () => {
      clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
    };
  }, [dispatch]);

  return null;
};
