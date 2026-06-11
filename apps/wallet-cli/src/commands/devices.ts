import { defineCommand } from "@bunli/core";
import { createCommandOutput } from "../output";
import { listWalletCliDevices } from "../device/register-dmk-transport";
import { outputOption, resolveOutputFormat } from "./inputs";

export default defineCommand({
  name: "devices",
  description:
    "List reachable Ledger devices across transports (USB and BLE), without device approval. " +
    "Use a name or id with --device or WALLET_CLI_DEVICE to target one.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "devices",
      network: "device",
    });

    await out.run(async () => {
      const devices = await out.withActivity(
        "Scanning for Ledger devices (usb, ble)…",
        "Scan complete",
        () => listWalletCliDevices(),
      );
      out.devices(devices);
    });
  },
});
