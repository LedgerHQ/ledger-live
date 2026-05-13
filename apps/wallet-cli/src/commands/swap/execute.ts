import { defineCommand, option } from "@bunli/core";
import { BigNumber } from "bignumber.js";
import { z } from "zod";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { findCryptoCurrencyById, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getCurrencyForAccount } from "@ledgerhq/types-live";
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
import { WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./quote-shared";

type RunFullSwapPipeline = typeof runFullSwapPipelineDefault;

const swapExecuteFlagsSchema = z.object({
  from: z.string().min(1, "Source currency is required (--from <currencyId>)"),
  to: z.string().min(1, "Destination currency is required (--to <currencyId>)"),
  provider: z.string().min(1, "Provider is required (--provider <name>)"),
  amount: z.string().min(1, "Amount is required (--amount <value>)"),
  "to-account": z.string().optional(),
  account: z.string().min(1).optional(),
  "fee-strategy": z.enum(["slow", "medium", "fast"]).default("medium"),
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

const allowedSwapExecuteProviderInput = new Set<string>(WALLET_CLI_DEFAULT_SWAP_PROVIDERS);

/**
 * Validates `swap execute --provider` against the wallet-cli quote provider set and maps legacy
 * `changelly` to `changelly_v2` for the exchange API.
 */
function resolveSwapExecuteProvider(provider: string): string {
  if (!allowedSwapExecuteProviderInput.has(provider)) {
    throw new Error(
      `Unsupported swap provider "${provider}". Allowed: ${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")}.`,
    );
  }
  return provider === "changelly" ? "changelly_v2" : provider;
}

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

  const fromCurrencyCatalog = findCryptoCurrencyById(flags.from);
  if (!fromCurrencyCatalog) {
    throw new Error(`Unknown source currency (--from): ${flags.from}`);
  }
  if (!findCryptoCurrencyById(flags.to)) {
    throw new Error(`Unknown destination currency (--to): ${flags.to}`);
  }

  const provider = resolveSwapExecuteProvider(flags.provider);

  const network = networkStringFromCurrencyId(flags.from);

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

    const fromAccountCurrencyId = getCurrencyForAccount(fromAccount).id;
    const toAccountCurrencyId = getCurrencyForAccount(toAccount).id;
    if (fromAccountCurrencyId !== flags.from) {
      throw new Error(
        `Source account asset is ${fromAccountCurrencyId}, but --from was ${flags.from}. Use matching --from and source account, or pick another source account.`,
      );
    }
    if (toAccountCurrencyId !== flags.to) {
      throw new Error(
        `Destination account asset is ${toAccountCurrencyId}, but --to was ${flags.to}. Use matching --to and destination account, or pick another destination account.`,
      );
    }

    const amountInAtomicUnit: BigNumber = parseCurrencyUnit(
      fromCurrencyCatalog.units[0],
      flags.amount,
    );

    const result = await runFullSwapPipeline({
      out,
      provider,
      amount: flags.amount,
      amountInAtomicUnit,
      feeStrategy: flags["fee-strategy"],
      fromAccount,
      toAccount,
      getAccountBridge: getBridge,
    });

    out.swapExecuteFullResult({
      from: flags.from,
      to: flags.to,
      provider,
      amount: flags.amount,
      transactionId: result.transactionId,
      payload: result.payload,
      operationHash: result.operationHash,
      swapId: result.swapId,
      amountExpectedTo: result.amountExpectedTo,
      magnitudeAwareRate: result.magnitudeAwareRate,
    });
  });
}

export default defineCommand({
  name: "execute",
  description:
    "Swap flow with Ledger device + API pipeline (nonce → payload → complete exchange → sign/broadcast).",
  options: {
    from: option(swapExecuteFlagsSchema.shape.from, {
      description: "Source currency ID",
      short: "f",
    }),
    to: option(swapExecuteFlagsSchema.shape.to, {
      description: "Destination currency ID",
      short: "t",
    }),
    provider: option(swapExecuteFlagsSchema.shape.provider, {
      description: `Swap provider (${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")};)`,
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
