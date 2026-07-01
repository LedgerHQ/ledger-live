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
import { type CommandOutput, type OutputContext, createCommandOutput } from "../output";
import {
  accountOption,
  deviceTimeoutOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptorV1,
  resolveOutputFormat,
} from "./inputs";
import { trackAddressResolved } from "./accounts-analytics";

export const receiveInputSchema = z.object({
  account: z.string().min(1, "Account session label is required"),
  verify: z.boolean().default(true),
  "device-timeout": z.coerce.number().int().positive().default(60_000),
});

export type ReceiveInput = z.infer<typeof receiveInputSchema>;

export function receiveContext(_input: ReceiveInput): OutputContext {
  return { command: "receive", network: "", account: "" };
}

export async function receiveCore(input: ReceiveInput, out: CommandOutput): Promise<void> {
  const wallet = new WalletAdapter();
  await out.run(async () => {
    const v1 = await resolveAccountDescriptorV1(resolveAccountArg(input.account, []));
    out.setContext({ network: serializeNetwork(v1.network), account: serializeV1(v1) });
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
    trackAddressResolved({ network: serializeNetwork(v1.network), deviceRequired: input.verify });
    if (input.verify) {
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
          deviceTimeoutMs: input["device-timeout"],
          onStateChange: state => out.deviceState(state),
        },
      );
    } else {
      out.address(address, false);
    }
  });
}

export default defineCommand({
  name: "receive",
  description: "Get receive address for an account (optionally verify on device)",
  options: {
    account: accountOption,
    verify: option(receiveInputSchema.shape.verify, {
      description:
        "Verify address on device screen (default: true). Use --no-verify to skip device.",
      short: "v",
      argumentKind: "flag",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const input: ReceiveInput = {
      // Required in-schema (so MCP rejects a missing arg); "" fallback routes an absent CLI
      // flag/positional to the core's friendly missing-account guard. See balances.ts.
      account: flags.account ?? positional[0] ?? "",
      verify: flags.verify,
      "device-timeout": flags["device-timeout"],
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), receiveContext(input));
    await receiveCore(input, out);
  },
});
