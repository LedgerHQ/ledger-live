import type { DeviceScreenState } from "@ledgerhq/live-dmk-desktop";
import type { DeviceScreenModel } from "./utils/deviceModel";

export interface DeviceScreenViewModel {
  /**
   * Whether to render at all. False unless the mock server transport is on and
   * an emulated device is connected — a physical device has its own screen.
   */
  readonly isVisible: boolean;
  readonly collapsed: boolean;
  readonly handleToggleCollapsed: () => void;
  readonly model: DeviceScreenModel | null;
  readonly state: DeviceScreenState;
}
