import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { parseAccountDescriptor, resolveAccountArg, OutputFormatSchema } from "../wallet/models";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../session/bridge-device-session";
import { spinner, colors, writeStdout } from "../shared/ui";

export default defineCommand({
  name: "receive",
  description: "Get receive address for an account (optionally verify on device)",
  options: {
    account: option(z.string().min(1).optional(), {
      description:
        "Short account descriptor (output of account discover), or pass as first positional arg",
      short: "a",
    }),
    verify: option(z.boolean().default(true), {
      description:
        "Verify address on device screen (default: true). Use --no-verify to skip device.",
      short: "v",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const wallet = new WalletAdapter();
    const isHuman = flags.output === "human";

    const outputAddress = (address: string) =>
      writeStdout(isHuman ? address : JSON.stringify({ address }));

    if (flags.verify) {
      const spin = isHuman
        ? spinner(`Connect device and open ${colors.bold(descriptor.currencyId)} app…`)
        : null;

      let address = "";
      await withCurrencyDeviceSession(descriptor.currencyId, async () => {
        spin?.success("Device session established");
        const verifySpin = isHuman ? spinner("Confirm address on your Ledger device…") : null;
        address = await wallet.verifyAddress(descriptor, WALLET_CLI_DMK_DEVICE_ID);
        verifySpin?.success("Address confirmed on device");
      });

      outputAddress(address);
    } else {
      outputAddress(await wallet.getFreshAddress(descriptor));
    }
  },
});
