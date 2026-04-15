import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { WalletAdapter } from "../wallet";
import { HumanFormatter } from "../wallet/formatter";
import { parseAccountDescriptor, resolveAccountArg, OutputFormatSchema } from "../wallet/models";
import { TransactionIntentSchema, type TransactionIntent } from "../wallet/intents";
import { WALLET_CLI_DMK_DEVICE_ID } from "../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../session/bridge-device-session";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { spinner, colors, writeStdout } from "../shared/ui";
import { makeEnvelope, makeErrorEnvelope } from "../shared/response";

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
    account: option(z.string().min(1).optional(), {
      description:
        "Short account descriptor (output of account discover), or pass as first positional arg",
      short: "a",
    }),
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
    "dry-run": option(z.boolean().default(false), {
      description: "Prepare and validate transaction but do not sign or broadcast",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    const wallet = new WalletAdapter();
    const isHuman = flags.output === "human";
    const dryRun = flags["dry-run"];

    // Build the TransactionIntent based on the currency family
    const { family } = getCryptoCurrencyById(descriptor.currencyId);
    const builder = INTENT_BUILDERS[family];
    if (!builder) {
      throw new Error(
        `Unsupported family: ${family}. Supported: ${Object.keys(INTENT_BUILDERS).join(", ")}`,
      );
    }
    const intentData = builder(flags as SendFlags);

    let intent: TransactionIntent;
    try {
      intent = TransactionIntentSchema.parse(intentData);
    } catch (e) {
      if (!isHuman) {
        writeStdout(
          JSON.stringify(
            makeErrorEnvelope("send", HumanFormatter.formatError(e), network),
            null,
            2,
          ),
        );
        process.exit(1);
      }
      throw e;
    }

    try {
      // Phase 4a: dry-run should NOT open the device
      if (dryRun) {
        const dryRunSpin = isHuman ? spinner("Preparing transaction (dry run)…") : null;
        const prepared = await wallet.prepareSend(descriptor, intent);
        if (isHuman) {
          dryRunSpin!.clear();
          writeStdout(`  To:     ${prepared.recipient}`);
          writeStdout(`  Amount: ${colors.bold(colors.green(prepared.amount))}`);
          writeStdout(`  Fees:   ${colors.dim(prepared.fees)}`);
          dryRunSpin!.success("Dry run complete (transaction not broadcasted)");
        } else {
          writeStdout(
            JSON.stringify(
              makeEnvelope(
                "send",
                network,
                {
                  dry_run: true,
                  recipient: prepared.recipient,
                  amount: prepared.amount,
                  fee: prepared.fees,
                },
                descriptor.id,
              ),
              null,
              2,
            ),
          );
        }
        return;
      }

      const spin = isHuman
        ? spinner(`Connect device and open ${colors.bold(descriptor.currencyId)} app…`)
        : null;

      await withCurrencyDeviceSession(descriptor.currencyId, async () => {
        spin?.success("Device session established");

        const sendSpin = isHuman
          ? spinner(`Preparing ${colors.bold(descriptor.currencyId)} transaction…`)
          : null;
        const result: Record<string, unknown> = {};

        await new Promise<void>((resolve, reject) => {
          wallet.send(descriptor, intent, WALLET_CLI_DMK_DEVICE_ID, dryRun).subscribe({
            next: event => {
              if (!isHuman) {
                if (event.type === "prepared") {
                  result.recipient = event.recipient;
                  result.amount = event.amount;
                  result.fee = event.fees;
                } else if (event.type === "broadcasted") {
                  result.tx_hash = event.txHash;
                } else if (event.type === "dry-run") {
                  result.dry_run = true;
                }
                return;
              }
              switch (event.type) {
                case "prepared":
                  sendSpin!.clear();
                  writeStdout(`  To:     ${event.recipient}`);
                  writeStdout(`  Amount: ${colors.bold(colors.green(event.amount))}`);
                  writeStdout(`  Fees:   ${colors.dim(event.fees)}`);
                  sendSpin!.text = "Confirm transaction on device…";
                  break;
                case "device-streaming":
                  sendSpin!.text = `Streaming to device… ${Math.round(event.progress * 100)}%`;
                  break;
                case "device-signature-requested":
                  sendSpin!.text = "Please confirm on device…";
                  break;
                case "device-signature-granted":
                  sendSpin!.text = "Signed, broadcasting…";
                  break;
                case "dry-run":
                  sendSpin!.success("Dry run complete (transaction not broadcasted)");
                  break;
                case "broadcasted":
                  sendSpin!.success(`Broadcasted  ${colors.dim(event.txHash)}`);
                  break;
              }
            },
            error: (e: unknown) => {
              const msg = HumanFormatter.formatError(e);
              sendSpin?.error(msg);
              reject(new Error(msg));
            },
            complete: resolve,
          });
        });

        if (!isHuman) {
          writeStdout(
            JSON.stringify(
              makeEnvelope("send", network, result, descriptor.id),
              null,
              2,
            ),
          );
        }
      });
    } catch (e) {
      if (!isHuman) {
        writeStdout(
          JSON.stringify(
            makeErrorEnvelope("send", HumanFormatter.formatError(e), network),
            null,
            2,
          ),
        );
        process.exit(1);
      }
      throw e;
    }
  },
});
