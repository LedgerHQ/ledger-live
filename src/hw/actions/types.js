// @flow

import type { DeviceModelId } from "@ledgerhq/devices";

export type Device = {
  deviceId: string,
  deviceName?: string,
  modelId: DeviceModelId,
  wired: boolean
};

export type Action<Request, HookState, Result> = {|
  useHook: (?Device, Request) => HookState,
  mapResult: HookState => ?Result
|};
