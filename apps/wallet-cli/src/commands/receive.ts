import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import {
  serializeNetwork,
  serializeV1,
  toV0,
  currencyIdFromNetwork,
} from "../shared/accountDescriptor";
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
  resolveAccountDescriptorV1,
  resolveOutputFormat,
} from "./inputs";

export default defineCommand({
  name: "receive",
  description: "Get receive address for an account (optionally verify on device)",
  options: {
    account: accountOption,
    verify: option(z.boolean().default(true), {
      description:
        "Verify address on device screen (default: true). Use --no-verify to skip device.",
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
      const v1 = await resolveAccountDescriptorV1(resolveAccountArg(flags.account, positional));
      ctx.network = serializeNetwork(v1.network);
      ctx.account = serializeV1(v1);
      const currencyId = currencyIdFromNetwork(v1.network);
      const managerAppName = getManagerAppNameForCurrencyId(currencyId);
      const address =
        v1.type === "address"
          ? v1.address
          : await out.withActivity(
              `Scanning ${v1.network.name} blockchain for fresh address…`,
              "Fresh address resolved",
              () => wallet.getFreshAddress(toV0(v1)),
            );
      if (flags.verify) {
        out.preVerifyAddress(address);
        const spin = out.spin(`Connect device and open ${colors.bold(managerAppName)} app…`);
        await withCurrencyDeviceSession(
          currencyId,
          async () => {
            out.deviceState({ code: "awaiting_approval", reason: "verify_address" });
            try {
              const deviceAddress = await wallet.verifyAddress(toV0(v1), WALLET_CLI_DMK_DEVICE_ID);
              const hexAddress = address.toLowerCase().startsWith("0x");
              const match = hexAddress
                ? deviceAddress.toLowerCase() === address.toLowerCase()
                : deviceAddress === address;
              if (!match) {
                throw new Error(
                  `Address mismatch: device returned ${deviceAddress}, expected ${address}`,
                );
              }
              spin?.success("Address verified");
              out.address(address, true);
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
        out.address(address, false);
      }
    });
  },
});
