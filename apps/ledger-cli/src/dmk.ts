import { Observable, firstValueFrom, filter, take, timeout, throwError } from "rxjs";
import type { Ora } from "ora";

// FIXME: Replace the default path with the full DMK implementation once the IOUSBHost crash is resolved.
// The DMK (via @ledgerhq/device-transport-kit-node-hid) causes a SIGKILL on macOS due to
// IOUSBHost USB interface claiming (EXC_BREAKPOINT), triggered by the `usb` npm package.
// The DMK approach gives proper device unlock + open-app prompts via ConnectAppDeviceAction.
// Set DMK=true to opt into the DMK path (works on Linux; crashes on macOS).
// Tracking: fix @ledgerhq/device-transport-kit-node-hid macOS USB claiming crash.

/**
 * Wait for a Ledger device to be connected via USB, ensure the correct app is open,
 * then call fn(). Two modes:
 *
 * - Default: Uses TransportNodeHid.listen (node-hid based, safe on macOS).
 *   The caller is responsible for having the correct app open on the device.
 *
 * - DMK=true: Uses the Device Management Kit with ConnectAppDeviceAction.
 *   Provides proper device unlock + open-app prompts, but SIGKILL on macOS
 *   due to IOUSBHost USB claiming (EXC_BREAKPOINT via the `usb` npm package).
 */
export async function withDeviceApp<T>(
  appName: string,
  spinner: Ora,
  fn: () => Promise<T>,
): Promise<T> {
  if (process.env.DMK === "true") {
    return withDeviceAppDMK(appName, spinner, fn);
  }
  return withDeviceAppNodeHid(appName, spinner, fn);
}

async function withDeviceAppNodeHid<T>(
  appName: string,
  spinner: Ora,
  fn: () => Promise<T>,
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: TransportNodeHid } = require("@ledgerhq/hw-transport-node-hid");

  spinner.text = `Connect your Ledger and open the ${appName} app…`;

  await firstValueFrom(
    new Observable<any>(TransportNodeHid.listen).pipe(
      filter((e: any) => e.type === "add"),
      take(1),
      timeout({
        each: 60_000,
        with: () =>
          throwError(
            () => new Error("No Ledger device found after 60 seconds. Please connect your device via USB."),
          ),
      }),
    ),
  );

  spinner.text = `Ledger detected — make sure the ${appName} app is open…`;

  return fn();
}

// FIXME: This path crashes on macOS (EXC_BREAKPOINT SIGKILL from IOUSBHost).
// Only works reliably on Linux. Enable with DMK=true.
// Root cause: @ledgerhq/device-transport-kit-node-hid uses the `usb` npm package
// which calls IOUSBHost USB interface claiming APIs, which macOS kills with SIGKILL.
async function withDeviceAppDMK<T>(
  appName: string,
  spinner: Ora,
  fn: () => Promise<T>,
): Promise<T> {
  // Dynamic requires so these heavy/crashing deps are only loaded when DMK=true.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DeviceManagementKitBuilder, DeviceActionStatus, UserInteractionRequired } = require(
    "@ledgerhq/device-management-kit",
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { nodeHidTransportFactory } = require("@ledgerhq/device-transport-kit-node-hid");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ConnectAppDeviceAction } = require("@ledgerhq/live-dmk-shared");

  spinner.text = "Waiting for Ledger device (DMK mode)…";

  const dmk = new DeviceManagementKitBuilder().addTransport(nodeHidTransportFactory).build();

  let sessionId: string | undefined;
  try {
    // Wait for a device to appear
    const devices: any[] = await firstValueFrom(
      dmk.listenToAvailableDevices({}).pipe(
        filter((d: any[]) => d.length > 0),
        take(1),
        timeout({
          each: 60_000,
          with: () =>
            throwError(
              () =>
                new Error("No Ledger device found after 60 seconds. Please connect your device via USB."),
            ),
        }),
      ),
    );

    sessionId = await dmk.connect({ device: devices[0] });

    spinner.text = `Device connected — preparing ${appName} app…`;

    // ConnectAppDeviceAction handles unlock + open-app prompts automatically
    const deviceAction = new ConnectAppDeviceAction({
      input: {
        application: { name: appName },
        dependencies: [],
        requireLatestFirmware: false,
        allowMissingApplication: false,
        unlockTimeout: 0,
      },
    });

    const { observable } = dmk.executeDeviceAction({ sessionId, deviceAction });

    await firstValueFrom(
      observable.pipe(
        filter((state: any) => {
          // Update spinner for intermediate states
          if (state.status === DeviceActionStatus.Pending) {
            const req = state.intermediateValue?.requiredUserInteraction;
            if (req === UserInteractionRequired.UnlockDevice) {
              spinner.text = "Please unlock your Ledger device…";
            } else if (req && req !== UserInteractionRequired.None) {
              spinner.text = `Please follow the instructions on your Ledger (${appName})…`;
            }
          }
          return (
            state.status === DeviceActionStatus.Completed ||
            state.status === DeviceActionStatus.Error
          );
        }),
      ),
    ).then((state: any) => {
      if (state.status === DeviceActionStatus.Error) {
        throw state.error ?? new Error("DMK device action failed");
      }
    });

    spinner.text = `${appName} app ready…`;

    const result = await fn();

    await dmk.disconnect({ sessionId }).catch(() => {});

    return result;
  } catch (err) {
    if (sessionId) {
      await dmk.disconnect({ sessionId }).catch(() => {});
    }
    throw err;
  }
}
