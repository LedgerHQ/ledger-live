import { mockDeviceOsUpdateState } from "./schema.mock";
import type { DeviceOsUpdateState } from "./schema";

export function mockDeviceOsUpdateRootState(overrides?: Partial<DeviceOsUpdateState>): {
  deviceOsUpdate: DeviceOsUpdateState;
} {
  return { deviceOsUpdate: mockDeviceOsUpdateState(overrides) };
}
