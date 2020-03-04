// @flow

import type { DeviceModelId } from "@ledgerhq/devices";

export type Device = {
  path: string,
  modelId: DeviceModelId
};

export type Action<Request, HookState, Result> = {|
  useHook: (?Device, Request) => HookState,
  mapResult: HookState => ?Result
|};
