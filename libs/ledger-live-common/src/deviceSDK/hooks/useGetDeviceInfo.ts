import { useEffect, useState } from "react";
import {
  getDeviceInfoAction as defaultGetDeviceInfoAction,
  GetDeviceInfoActionState,
  initialState,
} from "../actions/getDeviceInfo";

export type UseGetDeviceInfoArgs = {
  getDeviceInfoAction?: typeof defaultGetDeviceInfoAction;
  deviceId: string;
  deviceName: string | null;
};

export const useGetDeviceInfo = ({
  getDeviceInfoAction = defaultGetDeviceInfoAction,
  deviceId,
  deviceName,
}: UseGetDeviceInfoArgs): GetDeviceInfoActionState => {
  const [state, setState] = useState<GetDeviceInfoActionState>(initialState);

  useEffect(() => {
    const sub = getDeviceInfoAction({ deviceId, deviceName }).subscribe(setState);

    return () => sub.unsubscribe();
  }, [deviceId, getDeviceInfoAction, deviceName]);

  return state;
};
