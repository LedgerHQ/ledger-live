import type { DeviceModelId } from "@ledgerhq/devices";

export type Device = {
  deviceId: string;
  deviceName?: string | null;
  modelId: DeviceModelId;
  wired: boolean;
};

export type Action<Request, HookState, Result> = {
  useHook: (arg0: Device | null | undefined, arg1: Request) => HookState;
  mapResult: (arg0: HookState) => Result | null | undefined;
};

export type LockedDeviceEvent = {
  type: "lockedDevice";
};
