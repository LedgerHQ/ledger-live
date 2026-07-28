import { defineCommand, option } from "@bunli/core";
import { BigNumber } from "bignumber.js";
import { z } from "zod";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { findCryptoCurrencyById, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getQuotes } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import type { Quote } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyForAccount, type Account, type AccountLike } from "@ledgerhq/types-live";
import { getMainAccount, getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
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
import { runCliSwapDie as runCliSwapDiePipelineDefault } from "./cli-swap-die-pipeline";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  isDieExecutionProvider,
  resolveSwapProvider,
  WALLET_CLI_DEFAULT_SWAP_PROVIDERS,
} from "./providers";
import { swapFlowId, trackSwapFailed, trackSwapSimulated } from "../../analytics/swap-analytics";
import { getErrorDetails } from "@ledgerhq/live-common/exchange/error";

type RunFullSwapPipeline = typeof runFullSwapPipelineDefault;
type RunCliSwapDiePipeline = typeof runCliSwapDiePipelineDefault;
type GetQuotes = typeof getQuotes;

type CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency;
type FindTokenById = (id: string) => Promise<TokenCurrency | null | undefined>;

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
    if (flag === "to") {
      return makeEmptyTokenAccount(parentAccount, currency);
    }
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
  runCliSwapDiePipeline?: RunCliSwapDiePipeline;
  resolveAccountDescriptor?: typeof resolveAccountDescriptor;
  integrateNewAccountDescriptor?: typeof integrateNewAccountDescriptor;
  getAccountBridge?: typeof getAccountBridge;
  makeBridgeCacheSystem?: typeof makeBridgeCacheSystem;
  findTokenById?: FindTokenById;
  getQuotes?: GetQuotes;
};

async function selectDieQuote(
  getQuotesFn: GetQuotes,
  args: {
    provider: string;
    from: string;
    to: string;
    amount: string;
    sendAddress: string;
    receiveAddress: string;
  },
): Promise<Quote> {
  const { quotes, providerErrors } = await getQuotesFn(
    {
      providers: [args.provider],
      data: {
        amount: args.amount,
        uniswapOrderType: "all",
        sendCurrencyId: args.from,
        receiveCurrencyId: args.to,
        sendAddress: args.sendAddress,
        receiveAddress: args.receiveAddress,
        sendAccountId: "",
        receiveAccountId: "",
      },
    },
    { accounts: [], spotPrices: {}, locale: "en", counterValueCurrency: "USD" },
  );

  const match = quotes.find(q => q.provider === args.provider) ?? quotes[0];
  if (!match) {
    const summary =
      providerErrors.length > 0
        ? providerErrors.map(e => `${e.provider}: ${e.message}`).join("; ")
        : "no quotes returned";
    throw new Error(`No quote from '${args.provider}': ${summary}`);
  }
  return match;
}

export async function executeSwapCommand({
  flags,
  positional,
  runFullSwapPipeline,
  runCliSwapDiePipeline = runCliSwapDiePipelineDefault,
  resolveAccountDescriptor: resolveDescriptor = resolveAccountDescriptor,
  integrateNewAccountDescriptor: integrateDescriptor = integrateNewAccountDescriptor,
  getAccountBridge: getBridge = getAccountBridge,
  makeBridgeCacheSystem: makeCacheSystem = makeBridgeCacheSystem,
  findTokenById = id => getCryptoAssetsStore().findTokenById(id),
  getQuotes: getQuotesFn = getQuotes,
}: {
  flags: SwapExecuteFlags;
  positional: readonly string[];
} & SwapExecuteDependencies): Promise<void> {
  const flowId = swapFlowId();
  const resolveSwapExecuteContext = async () => {
    const fromDescriptor = await resolveDescriptor(resolveAccountArg(flags.account, positional));
    const fromCurrency = findCryptoCurrencyById(flags.from) ?? (await findTokenById(flags.from));
    const toCurrency = findCryptoCurrencyById(flags.to) ?? (await findTokenById(flags.to));

    if (!fromCurrency) {
      throw new Error(`Unknown source currency (--from): ${flags.from}`);
    }

    if (!toCurrency) {
      throw new Error(`Unknown destination currency (--to): ${flags.to}`);
    }

    const provider = resolveSwapProvider(flags.provider);
    return { fromDescriptor, fromCurrency, toCurrency, provider };
  };

  let context: Awaited<ReturnType<typeof resolveSwapExecuteContext>>;
  try {
    context = await resolveSwapExecuteContext();
  } catch (err) {
    const { name, cause } = getErrorDetails(err);
    trackSwapFailed({
      flowId,
      fromCurrency: flags.from,
      toCurrency: flags.to,
      errorCode: cause?.swapCode ?? name ?? "UnknownError",
    });
    throw err;
  }
  const { fromDescriptor, fromCurrency, toCurrency, provider } = context;

  trackSwapSimulated({
    flowId,
    fromCurrency: flags.from,
    toCurrency: flags.to,
    provider,
  });

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
      throw new Error("Swap execute requires --to-account <descriptor-or-session-label>.");
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

    const accounts: AccountLike[] = [
      fromAccount,
      toParentAccount,
      fromParentAccount,
      toAccount,
    ].filter((a): a is AccountLike => a != null);
    const fromParent = getParentAccount(fromAccount, accounts);
    const mainFromAccount: Account = getMainAccount(fromAccount, fromParent);

    if (isDieExecutionProvider(provider) && mainFromAccount.currency.family === "evm") {
      out.swapExecuteProgress(`[i] Using provider=${provider}; fetching quote…`);

      const toParent = getParentAccount(toAccount, accounts);
      const mainToAccount: Account = getMainAccount(toAccount, toParent);
      const receiveAddress = mainToAccount.freshAddress;

      const quote = await selectDieQuote(getQuotesFn, {
        provider,
        from: flags.from,
        to: flags.to,
        amount: flags.amount,
        sendAddress: mainFromAccount.freshAddress,
        receiveAddress,
      });

      const dieResult = await runCliSwapDiePipeline({
        out,
        quote,
        mainAccount: mainFromAccount,
        fromCurrencyId:
          fromAccount.type === "TokenAccount" ? fromAccount.token.id : fromAccount.currency.id,
        toCurrencyId: flags.to,
        flowId,
        feeStrategy: flags["fee-strategy"],
      });

      if (dieResult.plan !== "skip") {
        out.swapExecuteDieResult({
          plan: dieResult.plan,
          from: flags.from,
          to: flags.to,
          provider: quote.provider,
          amount: flags.amount,
          quoteId: quote.id ?? null,
          approvalTxHash: dieResult.result.approvalTxHash,
          swapTxHash: dieResult.result.swapTxHash,
        });
        return;
      }

      out.swapExecuteProgress(
        `[i] Embedded coin-app flow skipped (${dieResult.skipReason ?? "no reason"}); falling back to legacy Exchange-app pipeline.`,
      );
    }

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
      flowId,
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
      amountExpectedToAtomic: result.amountExpectedToAtomic,
      magnitudeAwareRate: result.magnitudeAwareRate,
    });
  });
}

export default defineCommand({
  name: "execute",
  description:
    "Swap flow on the connected Ledger. DEX providers (uniswap, 1inch/oneinch, velora, okx) run end-to-end in the partner's embedded coin app; every other provider runs the legacy Exchange-app pipeline (nonce → payload → complete exchange → sign/broadcast).",
  options: {
    from: option(swapExecuteFlagsSchema.shape.from, {
      description:
        "Source currency ID — native (e.g. ethereum) or token <network>/erc20/<slug> (e.g. ethereum/erc20/usd_tether__erc20_)",
      short: "f",
    }),
    to: option(swapExecuteFlagsSchema.shape.to, {
      description:
        "Destination currency ID — native (e.g. bitcoin) or token <network>/erc20/<slug> (e.g. ethereum/erc20/usd_tether__erc20_)",
      short: "t",
    }),
    provider: option(swapExecuteFlagsSchema.shape.provider, {
      description: `Swap provider (${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")})`,
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
      runCliSwapDiePipeline: runCliSwapDiePipelineDefault,
    });
  },
});
