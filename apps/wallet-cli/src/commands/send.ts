import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { WalletAdapter } from "../wallet";
import { TransactionIntentSchema } from "../wallet/intents";
import type { AccountDescriptor } from "../wallet/models";
import {
  WALLET_CLI_DMK_DEVICE_ID,
  getWalletCliDeviceModelId,
} from "../device/register-dmk-transport";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  getManagerAppNameForCurrencyId,
  withCurrencyDeviceSession,
} from "../session/bridge-device-session";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { colors } from "../shared/ui";
import { createCommandOutput } from "../output";
import { runObservable } from "./run-observable";
import {
  accountOption,
  deviceTimeoutOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";

type SendFlags = {
  account?: string;
  to: string;
  amount: string;
  "fee-per-byte"?: string;
  rbf?: boolean;
  mode?: string;
  validator?: string;
  "stake-account"?: string;
  memo?: string;
  data?: string;
  "dry-run": boolean;
  output?: "human" | "json";
};

type IntentBuilder = (flags: SendFlags) => unknown;

const INTENT_BUILDERS: Record<string, IntentBuilder> = {
  bitcoin: flags => ({
    family: "bitcoin",
    recipient: flags.to,
    amount: flags.amount,
    feePerByte: flags["fee-per-byte"],
    rbf: flags.rbf,
  }),
  evm: flags => ({
    family: "evm",
    recipient: flags.to,
    amount: flags.amount,
    data: flags.data,
  }),
  solana: flags => ({
    family: "solana",
    recipient: flags.to,
    amount: flags.amount,
    mode: flags.mode,
    validator: flags.validator,
    stakeAccount: flags["stake-account"],
    memo: flags.memo,
  }),
};

function buildIntentData(currencyId: string, flags: SendFlags) {
  const { family } = getCryptoCurrencyById(currencyId);
  const builder = INTENT_BUILDERS[family];
  if (!builder) {
    throw new Error(
      `Unsupported family: ${family}. Supported: ${Object.keys(INTENT_BUILDERS).join(", ")}`,
    );
  }
  return builder(flags);
}

async function runDryRunSend(
  wallet: WalletAdapter,
  descriptor: AccountDescriptor,
  intent: ReturnType<typeof TransactionIntentSchema.parse>,
  out: ReturnType<typeof createCommandOutput>,
): Promise<void> {
  const spin = out.spin("Preparing transaction (dry run)…");
  const prepared = await wallet.prepareSend(descriptor, intent);
  spin?.success("Dry run complete (transaction not broadcasted)");
  out.sendDryRun(prepared);
}

type RunLiveSendParams = {
  wallet: WalletAdapter;
  descriptor: AccountDescriptor;
  intent: ReturnType<typeof TransactionIntentSchema.parse>;
  managerAppName: string;
  deviceTimeoutMs: number | undefined;
  out: ReturnType<typeof createCommandOutput>;
};

async function runLiveSend({
  wallet,
  descriptor,
  intent,
  managerAppName,
  deviceTimeoutMs,
  out,
}: RunLiveSendParams): Promise<void> {
  out.spin(`Connect device and open ${colors.bold(managerAppName)} app…`);
  await withCurrencyDeviceSession(
    descriptor.currencyId,
    async () => {
      out.spin(`Preparing ${colors.bold(managerAppName)} transaction…`);

      const deviceModelId = await getWalletCliDeviceModelId();
      if (deviceModelId === undefined) {
        throw new Error(
          "Could not determine device model from the active session. Disconnect and reconnect the device.",
        );
      }

      await runObservable({
        source$: wallet.send(descriptor, intent, {
          deviceId: WALLET_CLI_DMK_DEVICE_ID,
          deviceModelId,
        }),
        onNext: event => out.sendEvent(event),
        mapError: error =>
          WalletCliDeviceError.fromKnownDeviceError(error, {
            expectedApp: managerAppName,
            rejectedContext: "sign",
          }) ?? error,
      });

      out.sendComplete();
    },
    {
      deviceTimeoutMs,
      onStateChange: state => out.deviceState(state),
    },
  );
}

export default defineCommand({
  name: "send",
  description: "Sign and broadcast a transaction",
  options: {
    account: accountOption,
    to: option(z.string().min(1, "Recipient address is required (--to <address>)"), {
      description: "Recipient address",
      short: "t",
    }),
    amount: option(
      z.string().min(1, "Amount is required (--amount '<value> <TICKER>', e.g. '0.01 ETH')"),
      {
        description: "Amount including ticker, e.g. '0.001 BTC', '0.01 ETH', '0.4 USDT'",
      },
    ),
    "fee-per-byte": option(z.string().min(1).optional(), {
      description: "Fee per byte in satoshis (Bitcoin only)",
    }),
    rbf: option(z.boolean().optional(), {
      description: "Enable Replace-By-Fee (Bitcoin only)",
      argumentKind: "flag",
    }),
    mode: option(z.string().min(1).optional(), {
      description:
        "Transaction mode for Solana: send, stake.createAccount, stake.delegate, stake.undelegate, stake.withdraw",
    }),
    validator: option(z.string().min(1).optional(), {
      description: "Validator address (Solana staking only)",
    }),
    "stake-account": option(z.string().min(1).optional(), {
      description: "Stake account address (Solana staking only)",
    }),
    memo: option(z.string().min(1).optional(), {
      description: "Memo/tag (Solana only)",
    }),
    data: option(
      z
        .string()
        .regex(
          /^0x([0-9a-fA-F]{2})*$/,
          "data must be 0x-prefixed hex with an even number of digits",
        )
        .optional(),
      {
        description: "EVM calldata as 0x-prefixed hex (e.g. 0xd0e30db0)",
      },
    ),
    "dry-run": option(z.boolean().default(false), {
      description: "Prepare and validate transaction but do not sign or broadcast",
      argumentKind: "flag",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const ctx = { command: "send", network: "", account: "" };
    const output = resolveOutputFormat(flags.output);
    const wallet = new WalletAdapter();
    const dryRun = flags["dry-run"];
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
      const descriptor = await resolveAccountDescriptor(
        resolveAccountArg(flags.account, positional),
      );
      ctx.network = networkStringFromCurrencyId(descriptor.currencyId);
      ctx.account = descriptor.id;
      const managerAppName = getManagerAppNameForCurrencyId(descriptor.currencyId);

      // Build the TransactionIntent based on the currency family
      const intentData = buildIntentData(descriptor.currencyId, flags as SendFlags);

      // Intent schema parse may throw (ZodError) — out.run catches it in json mode
      const intent = TransactionIntentSchema.parse(intentData);

      if (dryRun) {
        await runDryRunSend(wallet, descriptor, intent, out);
        return;
      }
      await runLiveSend({
        wallet,
        descriptor,
        intent,
        managerAppName,
        deviceTimeoutMs: flags["device-timeout"],
        out,
      });
    });
  },
});
