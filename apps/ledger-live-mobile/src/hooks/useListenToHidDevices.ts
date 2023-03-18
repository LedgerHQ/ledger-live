import { useEffect, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Observable, Subscription } from "rxjs";
import { DescriptorEvent, DeviceModelId } from "@ledgerhq/types-devices";
import HIDTransport from "@ledgerhq/react-native-hid";
import { map } from "rxjs/operators";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import { setWiredDevice } from "../actions/appstate";
import { DeviceLike } from "../reducers/types";
import { AppStateSetWiredDevicePayload } from "../actions/types";

/**
 * Allows LLM to be aware of USB OTG connections on Android as they happen.
 * Opening the door for OTG tailored flows and logic. Currently only used to
 * know whether we have a connected USB device when accessing the firmware
 * update flow via the Banner from the portfolio.
 */
const DELAY = 1000;
export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  const [nonce, setNonce] = useState(0);
  const isMounted = useIsMounted();

  // Error and Complete will trigger a new listen.
  const onScheduleNewListen = useCallback(() => {
    setTimeout(() => {
      if (isMounted()) {
        setNonce(nonce => nonce + 1);
      }
    }, DELAY);
  }, [isMounted]);

  useEffect(() => {
    let sub: Subscription;
    if (isMounted()) {
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
          next: (wiredDevice: AppStateSetWiredDevicePayload) => {
            dispatch(setWiredDevice(wiredDevice));
          },
          error: () => {
            onScheduleNewListen();
          },
          complete: () => {
            onScheduleNewListen();
          },
        });
    }

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [dispatch, isMounted, nonce, onScheduleNewListen]);

  return null;
};
