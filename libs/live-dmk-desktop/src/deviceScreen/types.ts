import type { Device, SpeculosAction, SpeculosButton } from "@ledgerhq/device-mockserver-client";

/**
 * Input the user can send to the emulated device.
 *
 * Press and release are separate so a hold reaches the device as a hold — Stax
 * and Flex gate their confirmations behind one, and collapsing both into a
 * single instant action makes those flows impossible to complete.
 */
export interface DeviceScreenInput {
  pressButton(button: SpeculosButton, action: SpeculosAction): void;
  /** Coordinates in device screen pixels, not CSS pixels. */
  touch(x: number, y: number, action: SpeculosAction): void;
}

export type DeviceScreenState =
  /** No screen for this transport, or nothing to show yet. */
  | { kind: "unavailable" }
  | { kind: "loading" }
  /**
   * Nothing to capture — on the mock server that means no app is running — so
   * the device's metadata stands in.
   */
  | { kind: "os-info"; device: Device }
  /** A still frame, refreshed by the poller. */
  | { kind: "image"; src: string; input: DeviceScreenInput }
  | { kind: "error"; message: string };
