import type { SpeculosAction, SpeculosButton } from "@ledgerhq/device-mockserver-client";
import type { DeviceScreenState } from "./types";

/**
 * How the poller reaches a device's screen. The mock server proxies through to
 * a Speculos instance; a future direct-Speculos source would answer the same
 * three calls with only the address differing, which is why the panel is given
 * this interface rather than a client.
 */
export interface ScreenApi {
  /** Resolves null when there is no screen to capture right now. */
  screenshot(): Promise<Blob | null>;
  /**
   * What to show while `screenshot` keeps resolving null. Omitted by apis whose
   * screen is always there.
   */
  idle?(): Promise<DeviceScreenState>;
  pressButton(button: SpeculosButton, action: SpeculosAction): Promise<void>;
  /** Coordinates in device screen pixels. */
  touch(x: number, y: number, action: SpeculosAction): Promise<void>;
}
