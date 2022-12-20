import { useEffect, useState } from "react";
import {
  getDeviceInfoAction as defaultGetDeviceInfoAction,
  GetDeviceInfoActionState,
  initialState,
} from "../actions/getDeviceInfo";

export type UseGetDeviceInfoArgs = {
  getDeviceInfoAction: typeof defaultGetDeviceInfoAction;
  deviceId: string;
};

export const useGetDeviceInfo = ({
  getDeviceInfoAction = defaultGetDeviceInfoAction,
  deviceId,
}: UseGetDeviceInfoArgs): GetDeviceInfoActionState => {
  const [state, setState] = useState<GetDeviceInfoActionState>(initialState);

  useEffect(() => {
    const sub = getDeviceInfoAction({ deviceId }).subscribe(setState);

    return () => sub.unsubscribe();
  }, [deviceId, getDeviceInfoAction]);

  return state;
};
