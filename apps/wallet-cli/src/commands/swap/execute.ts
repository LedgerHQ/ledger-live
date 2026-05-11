import { defineCommand, option } from "@bunli/core";
import { BigNumber } from "bignumber.js";
import { z } from "zod";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { findCryptoCurrencyById, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { integrateNewAccountDescriptor } from "@ledgerhq/live-wallet/walletsync/modules/accounts";
import { createCommandOutput } from "../../output";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "../inputs";
import { networkStringFromCurrencyId } from "../../shared/accountDescriptor";
import { OutputFormatSchema } from "../../wallet/models";
import { runFullSwapPipeline as runFullSwapPipelineDefault } from "./cli-swap-pipeline";

type RunFullSwapPipeline = typeof runFullSwapPipelineDefault;

const swapExecuteFlagsSchema = z.object({
  provider: z.string().min(1, "Provider is required (--provider <name>)"),
  amount: z.string().min(1, "Amount is required (--amount <value>)"),
  "to-account": z.string().optional(),
  account: z.string().min(1).optional(),
  "fee-strategy": z.enum(["slow", "medium", "fast"]).default("medium"),
  "dry-run": z.boolean().default(false),
  output: OutputFormatSchema.optional(),
});

export type SwapExecuteFlags = z.infer<typeof swapExecuteFlagsSchema>;

export type SwapExecuteDependencies = {
  runFullSwapPipeline: RunFullSwapPipeline;
  resolveAccountDescriptor?: typeof resolveAccountDescriptor;
  integrateNewAccountDescriptor?: typeof integrateNewAccountDescriptor;
  getAccountBridge?: typeof getAccountBridge;
  makeBridgeCacheSystem?: typeof makeBridgeCacheSystem;
};

export async function executeSwapCommand({
  flags,
  positional,
  runFullSwapPipeline,
  resolveAccountDescriptor: resolveDescriptor = resolveAccountDescriptor,
  integrateNewAccountDescriptor: integrateDescriptor = integrateNewAccountDescriptor,
  getAccountBridge: getBridge = getAccountBridge,
  makeBridgeCacheSystem: makeCacheSystem = makeBridgeCacheSystem,
}: {
  flags: SwapExecuteFlags;
  positional: readonly string[];
} & SwapExecuteDependencies): Promise<void> {
  const fromDescriptor = await resolveDescriptor(resolveAccountArg(flags.account, positional));
  const fromCurrency = findCryptoCurrencyById(fromDescriptor.currencyId);
  if (!fromCurrency) {
    throw new Error(`Currency ${fromDescriptor.currencyId} not found`);
  }

  const amountInAtomicUnit: BigNumber = parseCurrencyUnit(fromCurrency.units[0], flags.amount);

  const network = networkStringFromCurrencyId(fromDescriptor.currencyId);

  const out = createCommandOutput(resolveOutputFormat(flags.output), {
    command: "swap execute",
    network,
  });

  await out.run(async () => {
    const syncCache = makeCacheSystem({
      saveData: async () => {},
      getData: async () => undefined,
    });

    const toAccountArg = flags["to-account"];
    if (typeof toAccountArg !== "string" || toAccountArg.trim().length === 0) {
      throw new Error("Swap execute requires --to-account <descriptor-or-label>.");
    }
    const toDescriptor = await resolveDescriptor(toAccountArg);

    out.swapExecuteProgress(
      `[i] Syncing source (${fromDescriptor.id}) and destination (${toDescriptor.id}) accounts…`,
    );
    const [fromAccount, toAccount] = await Promise.all([
      integrateDescriptor(fromDescriptor, getBridge, syncCache),
      integrateDescriptor(toDescriptor, getBridge, syncCache),
    ]);

    const result = await runFullSwapPipeline({
      out,
      provider: flags.provider,
      amount: flags.amount,
      amountInAtomicUnit,
      feeStrategy: flags["fee-strategy"],
      dryRun: flags["dry-run"],
      fromAccount,
      toAccount,
      getAccountBridge: getBridge,
    });

    out.swapExecuteFullResult({
      provider: flags.provider,
      amount: flags.amount,
      transactionId: result.transactionId,
      payload: result.payload,
      operationHash: flags["dry-run"] ? undefined : result.operationHash,
      swapId: result.swapId,
      amountExpectedTo: result.amountExpectedTo,
      magnitudeAwareRate: result.magnitudeAwareRate,
      dryRun: result.dryRun,
    });
  });
}

export default defineCommand({
  name: "execute",
  description:
    "Swap flow with Ledger device + API pipeline (nonce → payload → complete exchange → sign/broadcast).",
  options: {
    provider: option(swapExecuteFlagsSchema.shape.provider, {
      description: "Swap provider name, e.g. changelly",
    }),
    amount: option(swapExecuteFlagsSchema.shape.amount, {
      description: "Swap source amount in human units",
    }),
    "to-account": option(swapExecuteFlagsSchema.shape["to-account"], {
      description: "Destination account descriptor or session label (required for full pipeline)",
    }),
    account: accountOption,
    "fee-strategy": option(swapExecuteFlagsSchema.shape["fee-strategy"], {
      description: "Fee strategy for the refund-chain transaction (full pipeline)",
    }),
    "dry-run": option(swapExecuteFlagsSchema.shape["dry-run"], {
      description: "Run through exchange preparation but do not sign or broadcast",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    await executeSwapCommand({
      flags,
      positional,
      runFullSwapPipeline: runFullSwapPipelineDefault,
    });
  },
});
