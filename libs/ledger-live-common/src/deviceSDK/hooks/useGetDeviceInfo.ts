import { useEffect, useState } from "react";
import {
  getDeviceInfoAction as defaultGetDeviceInfoAction,
  GetDeviceInfoActionState,
  initialState,
} from "../actions/getDeviceInfo";

export type UseGetDeviceInfoArgs = {
  getDeviceInfoAction?: typeof defaultGetDeviceInfoAction;
  deviceId?: string;
};

// to be used in an E2E test context
let mockedGetDeviceInfoAction: typeof defaultGetDeviceInfoAction | undefined;

export function mockGetDeviceInfoAction(
  mockedAction: typeof defaultGetDeviceInfoAction
) {
  mockedGetDeviceInfoAction = mockedAction;
}

export const useGetDeviceInfo = ({
  deviceId,
  getDeviceInfoAction = mockedGetDeviceInfoAction ?? defaultGetDeviceInfoAction,
}: UseGetDeviceInfoArgs): GetDeviceInfoActionState => {
  const [state, setState] = useState<GetDeviceInfoActionState>(initialState);

  useEffect(() => {
    if (deviceId) {
      const sub = getDeviceInfoAction({ deviceId }).subscribe(setState);

      return () => sub.unsubscribe();
    }
  }, [deviceId, getDeviceInfoAction]);

  return state;
};
