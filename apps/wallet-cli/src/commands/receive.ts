import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  getManagerAppNameForCurrencyId,
  withCurrencyDeviceSession,
} from "../session/bridge-device-session";
import { colors } from "../shared/ui";
import { createCommandOutput } from "../output";
import {
  accountOption,
  deviceTimeoutOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";

export default defineCommand({
  name: "receive",
  description: "Get receive address for an account (optionally verify on device)",
  options: {
    account: accountOption,
    verify: option(z.boolean().default(true), {
      description:
        "Verify address on device screen (default: true). Use --verify=false to skip device.",
      short: "v",
      argumentKind: "flag",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const ctx = { command: "receive", network: "", account: "" };
    const output = resolveOutputFormat(flags.output);
    const wallet = new WalletAdapter();
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
      const descriptor = await resolveAccountDescriptor(
        resolveAccountArg(flags.account, positional),
      );
      ctx.network = networkStringFromCurrencyId(descriptor.currencyId);
      ctx.account = descriptor.id;
      const managerAppName = getManagerAppNameForCurrencyId(descriptor.currencyId);
      if (flags.verify) {
        const spin = out.spin(`Connect device and open ${colors.bold(managerAppName)} app…`);
        await withCurrencyDeviceSession(
          descriptor.currencyId,
          async () => {
            out.deviceState({ code: "awaiting_approval", reason: "verify_address" });
            try {
              const address = await wallet.verifyAddress(descriptor, WALLET_CLI_DMK_DEVICE_ID);
              spin?.success("Address verified");
              out.address(address);
            } catch (e) {
              throw WalletCliDeviceError.fromUnknown(e, {
                expectedApp: managerAppName,
                rejectedContext: "verify_address",
              });
            }
          },
          {
            deviceTimeoutMs: flags["device-timeout"],
            onStateChange: state => out.deviceState(state),
          },
        );
      } else {
        out.address(await wallet.getFreshAddress(descriptor));
      }
    });
  },
});
