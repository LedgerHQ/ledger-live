import { useDispatch } from "~/context/hooks";
import { useEffect } from "react";
import { Observable } from "rxjs";
import { DescriptorEvent, DeviceModelId } from "@ledgerhq/types-devices";
import { map } from "rxjs/operators";
import { DeviceLike } from "../reducers/types";
import { setLastConnectedDevice } from "../actions/settings";
import { getHIDTransport } from "~/services/getHidTransport";
import { useDeviceManagementKitEnabled } from "@ledgerhq/live-dmk-mobile";
import { useIsFocused } from "@react-navigation/core";

/**
 * Allows LLM to be aware of USB OTG connections on Android as they happen.
 * Opening the door for OTG tailored flows and logic. Currently only used to
 * know whether we have a connected USB device when accessing the firmware
 * update flow via the Banner from the portfolio.
 */
export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  const isLDMKEnabled = useDeviceManagementKitEnabled();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    const sub = new Observable<DescriptorEvent<DeviceLike | string | null>>(o =>
      getHIDTransport({ isLDMKEnabled }).listen(o),
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
          if (wiredDevice) {
            dispatch(
              setLastConnectedDevice({
                deviceId: wiredDevice.id,
                modelId: wiredDevice.modelId,
                deviceName: wiredDevice.name,
                wired: true,
              }),
            );
          }
        },
        error: () => {
          sub.unsubscribe();
        },
        complete: () => {
          sub.unsubscribe();
        },
      });

    return () => {
      sub.unsubscribe();
    };
  }, [dispatch, isLDMKEnabled, isFocused]);

  return null;
};
