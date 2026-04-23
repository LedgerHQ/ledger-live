import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { parseAccountDescriptor, resolveAccountArg } from "../wallet/models";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../session/bridge-device-session";
import { colors } from "../shared/ui";
import { createCommandOutput } from "../output";
import { accountOption, outputOption } from "./shared-options";

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
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    const wallet = new WalletAdapter();
    const out = createCommandOutput(flags.output, {
      command: "receive",
      network,
      account: descriptor.id,
    });

    await out.run(async () => {
      if (flags.verify) {
        const spin = out.spin(`Connect device and open ${colors.bold(descriptor.currencyId)} app…`);
        await withCurrencyDeviceSession(descriptor.currencyId, async () => {
          spin?.success("Device session established");
          const verifySpin = out.spin("Confirm address on your Ledger device…");
          const address = await wallet.verifyAddress(descriptor, WALLET_CLI_DMK_DEVICE_ID);
          verifySpin?.success("Address confirmed on device");
          out.address(address);
        });
      } else {
        out.address(await wallet.getFreshAddress(descriptor));
      }
    });
  },
});
