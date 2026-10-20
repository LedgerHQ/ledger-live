import type {
  ConnectNewDeviceUIState,
  ConnectNewDeviceUIStateTypes,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";

export type ConnectNewDeviceDelays = {
  /** Time before the "I don't see my device" button shows, in ms. */
  deviceNotFound?: number;
  /** Time the success view shows before `onConnected` is called, in ms. */
  success?: number;
};

export type ConnectNewDeviceProps = {
  /** Called once, after the success view, with everything needed to talk to the device. */
  onConnected: (result: DeviceConnectionResult) => void;
  /**
   * Shows the "I don't see my device" button after the device not found delay, and is called when
   * the user presses it. Without it, the button never shows.
   */
  onDeviceNotFound?: () => void;
  /** Called when the user closes a discovery error or the unknown error. The flow is over. */
  onClose: () => void;
  /** Read on mount only. */
  delays?: ConnectNewDeviceDelays;
};

export type ConnectNewDeviceErrorUIState = Extract<
  ConnectNewDeviceUIState,
  {
    type:
      | typeof ConnectNewDeviceUIStateTypes.DiscoveryError
      | typeof ConnectNewDeviceUIStateTypes.ConnectionError
      | typeof ConnectNewDeviceUIStateTypes.UnknownError;
  }
>;

export type ConnectNewDeviceNonErrorUIState = Exclude<
  ConnectNewDeviceUIState,
  ConnectNewDeviceErrorUIState
>;
