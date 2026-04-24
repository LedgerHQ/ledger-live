import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { WalletAdapter } from "../wallet";
import { parseAccountDescriptor, resolveAccountArg } from "../wallet/models";
import { TransactionIntentSchema } from "../wallet/intents";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../session/bridge-device-session";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { colors } from "../shared/ui";
import { createCommandOutput } from "../output";
import { accountOption, outputOption } from "./shared-options";

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
  output: "human" | "json";
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

export default defineCommand({
  name: "send",
  description: "Sign and broadcast a transaction (bridge only, no Alpaca)",
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
        .regex(/^0x([0-9a-fA-F]{2})*$/, "data must be 0x-prefixed hex with an even number of digits")
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
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    const wallet = new WalletAdapter();
    const dryRun = flags["dry-run"];
    const out = createCommandOutput(flags.output, { command: "send", network, account: descriptor.id });

    // Build the TransactionIntent based on the currency family
    const { family } = getCryptoCurrencyById(descriptor.currencyId);
    const builder = INTENT_BUILDERS[family];
    if (!builder) {
      throw new Error(
        `Unsupported family: ${family}. Supported: ${Object.keys(INTENT_BUILDERS).join(", ")}`,
      );
    }
    const intentData = builder(flags as SendFlags);

    await out.run(async () => {
      // Intent schema parse may throw (ZodError) — out.run catches it in json mode
      const intent = TransactionIntentSchema.parse(intentData);

      if (dryRun) {
        const spin = out.spin("Preparing transaction (dry run)…");
        const prepared = await wallet.prepareSend(descriptor, intent);
        spin?.clear();
        out.sendDryRun(prepared);
        spin?.success("Dry run complete (transaction not broadcasted)");
        return;
      }

      const spin = out.spin(`Connect device and open ${colors.bold(descriptor.currencyId)} app…`);
      await withCurrencyDeviceSession(descriptor.currencyId, async () => {
        spin?.success("Device session established");
        out.spin(`Preparing ${colors.bold(descriptor.currencyId)} transaction…`);

        await lastValueFrom(
          wallet.send(descriptor, intent, WALLET_CLI_DMK_DEVICE_ID, dryRun).pipe(
            tap(event => out.sendEvent(event)),
          ),
        );

        out.sendComplete();
      });
    });
  },
});
