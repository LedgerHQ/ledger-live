import { defineCommand } from "@bunli/core";
import { DeviceOnDashboardExpected, UserRefusedAllowManager } from "@ledgerhq/errors";
import { getGenuineCheckFromDeviceId } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import type { GetGenuineCheckFromDeviceIdResult } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { isCounterfeitError } from "@ledgerhq/live-common/hw/isCounterfeitError";
import { TimeoutError, timeout } from "rxjs";
import { createCommandOutput } from "../output";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { withDmkDeviceSession } from "../session/bridge-device-session";
import { deviceTimeoutOption, outputOption, resolveOutputFormat } from "./inputs";
import { runObservable } from "./run-observable";

const SOCKET_EVENT_PAYLOAD_GENUINE = "0000";

class NonGenuineDeviceError extends Error {
  constructor() {
    super("Device is not genuine.");
    this.name = "NonGenuineDeviceError";
  }
}

function mapGenuineCheckError(error: unknown): unknown {
  if (error instanceof TimeoutError) {
    return new WalletCliDeviceError({ code: "timeout" }, { cause: error });
  }
  if (isCounterfeitError(error)) {
    return new NonGenuineDeviceError();
  }
  if (error instanceof UserRefusedAllowManager) {
    return new WalletCliDeviceError({ code: "rejected", context: "open_app" }, { cause: error });
  }
  if (error instanceof DeviceOnDashboardExpected) {
    return new WalletCliDeviceError(
      { code: "wrong_app", expected: "Ledger dashboard" },
      { cause: error },
    );
  }
  return (
    WalletCliDeviceError.fromKnownDeviceError(error, {
      expectedApp: "Ledger dashboard",
      rejectedContext: "open_app",
    }) ?? error
  );
}

export default defineCommand({
  name: "genuine-check",
  description: "Check whether the connected Ledger device is genuine",
  options: {
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags }) => {
    const ctx = { command: "genuine-check", network: "device" };
    const out = createCommandOutput(resolveOutputFormat(flags.output), ctx);

    await out.run(async () => {
      let isGenuine = false;
      const spin = out.spin("Connect and unlock your Ledger on the dashboard…");

      await withDmkDeviceSession(async () => {
        await runObservable<GetGenuineCheckFromDeviceIdResult>({
          source$: getGenuineCheckFromDeviceId({
            deviceId: WALLET_CLI_DMK_DEVICE_ID,
            deviceName: null,
          }).pipe(timeout({ each: flags["device-timeout"] })),
          onNext: ({ socketEvent, lockedDevice }) => {
            if (lockedDevice) {
              out.deviceState({ code: "awaiting_approval", reason: "unlock" });
              return;
            }
            if (!socketEvent) {
              if (spin) {
                spin.text = "Ledger unlocked. Starting genuine check…";
              }
              return;
            }

            switch (socketEvent.type) {
              case "device-permission-requested":
                if (spin) {
                  spin.text = "Allow Ledger Manager on device…";
                } else {
                  out.deviceState({ code: "awaiting_approval", reason: "open_app" });
                }
                break;
              case "device-permission-granted":
                if (spin) {
                  spin.text = "Verifying device genuineness…";
                }
                break;
              case "result":
                if (socketEvent.payload !== SOCKET_EVENT_PAYLOAD_GENUINE) {
                  throw new NonGenuineDeviceError();
                }
                isGenuine = true;
                break;
            }
          },
          mapError: mapGenuineCheckError,
        });
      });

      if (!isGenuine) {
        throw new Error("Genuine check completed without a result.");
      }
      out.genuineCheck();
    });
  },
});
