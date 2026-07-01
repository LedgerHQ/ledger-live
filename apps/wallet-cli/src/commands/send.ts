import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";
import { WalletAdapter } from "../wallet";
import { TransactionIntentSchema } from "../wallet/intents";
import { prepareIntentDryRun, signAndBroadcastIntent } from "../wallet/sign-and-broadcast";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { getManagerAppNameForCurrencyId } from "../session/bridge-device-session";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../output";
import {
  trackSendCompleted,
  trackSendFailed,
  trackSendRejected,
  trackSendStarted,
  type SendAssetClass,
} from "../analytics/send-analytics";
import {
  accountOption,
  deviceTimeoutOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";

export const sendInputSchema = z.object({
  account: z.string().min(1, "Account session label is required"),
  to: z.string().min(1, "Recipient address is required (--to <address>)"),
  amount: z.string().min(1, "Amount is required (--amount '<value> <TICKER>', e.g. '0.01 ETH')"),
  "fee-per-byte": z.string().min(1).optional(),
  rbf: z.boolean().optional(),
  mode: z.string().min(1).optional(),
  validator: z.string().min(1).optional(),
  "stake-account": z.string().min(1).optional(),
  memo: z.string().min(1).optional(),
  data: z
    .string()
    .regex(/^0x([0-9a-fA-F]{2})*$/, "data must be 0x-prefixed hex with an even number of digits")
    .optional(),
  "dry-run": z.boolean().default(false),
  "device-timeout": z.coerce.number().int().positive().default(60_000),
});

export type SendInput = z.infer<typeof sendInputSchema>;

type IntentBuilder = (input: SendInput) => unknown;

const INTENT_BUILDERS: Record<string, IntentBuilder> = {
  bitcoin: input => ({
    family: "bitcoin",
    recipient: input.to,
    amount: input.amount,
    feePerByte: input["fee-per-byte"],
    rbf: input.rbf,
  }),
  evm: input => ({
    family: "evm",
    recipient: input.to,
    amount: input.amount,
    data: input.data,
  }),
  solana: input => ({
    family: "solana",
    recipient: input.to,
    amount: input.amount,
    mode: input.mode,
    validator: input.validator,
    stakeAccount: input["stake-account"],
    memo: input.memo,
  }),
};

function sendErrorCode(error: unknown): string {
  if (error instanceof WalletCliDeviceError) {
    return error.state.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return "unknown";
}

function buildIntentData(currencyId: string, input: SendInput) {
  const { family } = getCryptoCurrencyById(currencyId);
  const builder = INTENT_BUILDERS[family];
  if (!builder) {
    throw new Error(
      `Unsupported family: ${family}. Supported: ${Object.keys(INTENT_BUILDERS).join(", ")}`,
    );
  }
  return builder(input);
}

/**
 * Best-effort native/token classification for analytics: ids that resolve to a known
 * crypto-currency are treated as native sends, anything else as a token send.
 */
function classifySendAssetClass(currencyId: string): SendAssetClass {
  return findCryptoCurrencyById(currencyId) ? "native" : "token";
}

export function sendContext(_input: SendInput): OutputContext {
  return { command: "send", network: "", account: "" };
}

export async function sendCore(input: SendInput, out: CommandOutput): Promise<void> {
  const wallet = new WalletAdapter();
  const dryRun = input["dry-run"];

  await out.run(async () => {
    const descriptor = await resolveAccountDescriptor(resolveAccountArg(input.account, []));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    out.setContext({ network, account: descriptor.id });
    const managerAppName = getManagerAppNameForCurrencyId(descriptor.currencyId);
    const assetClass = classifySendAssetClass(descriptor.currencyId);

    trackSendStarted({ network, assetClass, dryRun });

    try {
      // Build the TransactionIntent based on the currency family
      const intentData = buildIntentData(descriptor.currencyId, input);

      // Intent schema parse may throw (ZodError) — out.run catches it in json mode
      const intent = TransactionIntentSchema.parse(intentData);

      if (dryRun) {
        // The helper only prepares/validates; `send` owns the terminal envelope (json: dry-run
        // envelope, human: prepared transaction lines).
        const prepared = await prepareIntentDryRun({ wallet, descriptor, intent, out });
        out.sendDryRun(prepared);
        return;
      }
      const { deviceModelId } = await signAndBroadcastIntent({
        wallet,
        descriptor,
        intent,
        deviceId: WALLET_CLI_DMK_DEVICE_ID,
        managerAppName,
        deviceTimeoutMs: input["device-timeout"],
        out,
      });
      // The helper streams progress but no longer emits the final envelope; `send`'s result IS the
      // send, so it emits its own terminal envelope here (json: success envelope, human: no-op).
      out.sendComplete();
      trackSendCompleted({
        network,
        assetClass,
        amount: input.amount,
        device: deviceModelId,
      });
    } catch (error) {
      if (error instanceof WalletCliDeviceError && error.state.code === "rejected") {
        trackSendRejected({ network, device: error.state.deviceModelId });
      } else {
        trackSendFailed({
          errorCode: sendErrorCode(error),
          errorName: error instanceof Error ? error.name : "unknown",
        });
      }
      throw error;
    }
  });
}

export default defineCommand({
  name: "send",
  description: "Sign and broadcast a transaction",
  options: {
    account: accountOption,
    to: option(sendInputSchema.shape.to, {
      description: "Recipient address",
      short: "t",
    }),
    amount: option(sendInputSchema.shape.amount, {
      description: "Amount including ticker, e.g. '0.001 BTC', '0.01 ETH', '0.4 USDT'",
    }),
    "fee-per-byte": option(sendInputSchema.shape["fee-per-byte"], {
      description: "Fee per byte in satoshis (Bitcoin only)",
    }),
    rbf: option(sendInputSchema.shape.rbf, {
      description: "Enable Replace-By-Fee (Bitcoin only)",
      argumentKind: "flag",
    }),
    mode: option(sendInputSchema.shape.mode, {
      description:
        "Transaction mode for Solana: send, stake.createAccount, stake.delegate, stake.undelegate, stake.withdraw",
    }),
    validator: option(sendInputSchema.shape.validator, {
      description: "Validator address (Solana staking only)",
    }),
    "stake-account": option(sendInputSchema.shape["stake-account"], {
      description: "Stake account address (Solana staking only)",
    }),
    memo: option(sendInputSchema.shape.memo, {
      description: "Memo/tag (Solana only)",
    }),
    data: option(sendInputSchema.shape.data, {
      description: "EVM calldata as 0x-prefixed hex (e.g. 0xd0e30db0)",
    }),
    "dry-run": option(sendInputSchema.shape["dry-run"], {
      description: "Prepare and validate transaction but do not sign or broadcast",
      argumentKind: "flag",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const input: SendInput = {
      // Required in-schema (so MCP rejects a missing arg); "" fallback routes an absent CLI
      // flag/positional to the core's friendly missing-account guard. See balances.ts.
      account: flags.account ?? positional[0] ?? "",
      to: flags.to,
      amount: flags.amount,
      "fee-per-byte": flags["fee-per-byte"],
      rbf: flags.rbf,
      mode: flags.mode,
      validator: flags.validator,
      "stake-account": flags["stake-account"],
      memo: flags.memo,
      data: flags.data,
      "dry-run": flags["dry-run"],
      "device-timeout": flags["device-timeout"],
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), sendContext(input));
    await sendCore(input, out);
  },
});
