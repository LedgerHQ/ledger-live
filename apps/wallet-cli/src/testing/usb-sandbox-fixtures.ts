/**
 * Raw USB behaviour recorded on a real Ledger, for LIVE-31394.
 *
 * Linux: Ubuntu 22.04, kernel 6.8, node-usb 2.17.0 under bun 1.4.4, Ledger Flex on the dashboard.
 * The command ran under bubblewrap with the Claude Code sandbox's device layout
 * (`bwrap --ro-bind / / --dev /dev --unshare-pid --proc /proc`): sysfs stays readable and
 * `/dev/bus/usb` is gone. `genuine-check --output json` gave up after the 60 s discovery wait.
 */

export const LINUX_SANDBOX_LEDGER_NATIVE = {
  busNumber: 3,
  deviceAddress: 4,
  deviceDescriptor: { idVendor: 0x2c97, idProduct: 0x7000 },
};

/** Thrown by `WebUSBDevice.createInstance` for the Ledger the first scan listed. */
export const LINUX_SANDBOX_OPEN_ERROR_MESSAGE = "initialize error: Error: LIBUSB_ERROR_NO_DEVICE";

/**
 * Ledgers listed by each `getDeviceList()` call in the same process. libusb drops the device it
 * failed to open and fires a detach, so every later scan comes back without it.
 */
export const LINUX_SANDBOX_LEDGERS_PER_SCAN = [1, 0, 0] as const;
