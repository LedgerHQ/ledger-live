import { defineCommand, option } from "@bunli/core";
import { BigNumber } from "bignumber.js";
import { z } from "zod";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { findCryptoCurrencyById, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyForAccount, type AccountLike } from "@ledgerhq/types-live";
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
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { resolveSwapProvider, WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./providers";

type RunFullSwapPipeline = typeof runFullSwapPipelineDefault;

type CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency;

function resolveSwapAccountForCurrency(
  parentAccount: AccountLike,
  userCurrencyId: string,
  currency: CryptoOrTokenCurrency,
  flag: "from" | "to",
): AccountLike {
  if (parentAccount.type !== "Account") {
    if (getCurrencyForAccount(parentAccount).id === userCurrencyId) {
      return parentAccount;
    }
    throw new Error(`--${flag} account does not match the currency ID ${userCurrencyId}.`);
  }

  if (currency.type === "CryptoCurrency") {
    if (currency.id !== parentAccount.currency.id) {
      throw new Error(
        `--${flag} account is ${parentAccount.currency.id} but --${flag} is ${currency.id}.`,
      );
    }
    return parentAccount;
  }

  if (currency.parentCurrencyId !== parentAccount.currency.id) {
    throw new Error(
      `--${flag} account is ${parentAccount.currency.id} but token ${userCurrencyId} belongs to ${currency.parentCurrencyId}.`,
    );
  }

  const tokenSub = parentAccount.subAccounts?.find(
    sub => sub.type === "TokenAccount" && sub.token.id === userCurrencyId,
  );

  if (!tokenSub) {
    throw new Error(`${flag} account has no token sub-account for ${userCurrencyId}.`);
  }
  return tokenSub;
}

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
  const fromCurrency =
    findCryptoCurrencyById(flags.from) ?? (await getCryptoAssetsStore().findTokenById(flags.from));
  const toCurrency =
    findCryptoCurrencyById(flags.to) ?? (await getCryptoAssetsStore().findTokenById(flags.to));

  if (!fromCurrency) {
    throw new Error(`Unknown source currency (--from): ${flags.from}`);
  }

  if (!toCurrency) {
    throw new Error(`Unknown destination currency (--to): ${flags.to}`);
  }

  const provider = resolveSwapProvider(flags.provider);
  const networkCurrencyId =
    fromCurrency.type === "TokenCurrency" ? fromCurrency.parentCurrencyId : fromCurrency.id;
  const network = networkStringFromCurrencyId(networkCurrencyId);

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
      throw new Error("Swap execute requires --to-account <session-label>.");
    }
    const toDescriptor = await resolveDescriptor(toAccountArg);

    out.swapExecuteProgress(
      `[i] Syncing source (${fromDescriptor.id}) and destination (${toDescriptor.id}) accounts…`,
    );

    const [fromParentAccount, toParentAccount] = await Promise.all([
      integrateDescriptor(fromDescriptor, getBridge, syncCache),
      integrateDescriptor(toDescriptor, getBridge, syncCache),
    ]);

    const fromAccount = resolveSwapAccountForCurrency(
      fromParentAccount,
      flags.from,
      fromCurrency,
      "from",
    );
    const toAccount = resolveSwapAccountForCurrency(toParentAccount, flags.to, toCurrency, "to");

    const amountInAtomicUnit: BigNumber = parseCurrencyUnit(fromCurrency.units[0], flags.amount);

    const result = await runFullSwapPipeline({
      out,
      provider,
      amount: flags.amount,
      amountInAtomicUnit,
      feeStrategy: flags["fee-strategy"],
      fromAccount,
      toAccount,
      fromParentAccount,
      toParentAccount,
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
      description: `Swap provider (${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")})`,
    }),
    amount: option(swapExecuteFlagsSchema.shape.amount, {
      description: "Swap source amount in human units",
    }),
    "to-account": option(swapExecuteFlagsSchema.shape["to-account"], {
      description: "Destination account session label (required for full pipeline)",
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
