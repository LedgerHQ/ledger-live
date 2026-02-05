import { useDispatch } from "~/context/hooks";
import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { setLastConnectedDevice } from "../actions/settings";
import { useHidDevicesDiscovery } from "@ledgerhq/live-dmk-mobile";

/**
 * Allows LLM to be aware of USB OTG connections on Android as they happen.
 * Opening the door for OTG tailored flows and logic. Currently only used to
 * know whether we have a connected USB device when accessing the firmware
 * update flow via the Banner from the portfolio.
 */
export const useUpdateStoreWithHidDevice = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { hidDevices } = useHidDevicesDiscovery(isFocused);

  useEffect(() => {
    if (hidDevices.length > 0) {
      const device = hidDevices[0];
      dispatch(
        setLastConnectedDevice({
          deviceId: device.deviceId,
          modelId: device.modelId,
          deviceName: device.deviceName,
          wired: true,
        }),
      );
    }
  }, [dispatch, hidDevices]);

  return null;
};
