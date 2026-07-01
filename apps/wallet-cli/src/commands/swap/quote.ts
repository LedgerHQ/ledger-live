import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getQuotes, type QuotesError } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import { WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS } from "../../live-common-setup";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { WalletAdapter } from "../../wallet";
import {
  outputOption,
  resolveAccountDescriptor,
  resolveAccountDescriptorV1,
  resolveOutputFormat,
} from "../inputs";
import { mapSwapQuoteLine, WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./quote-shared";
import {
  swapFlowId,
  trackSwapQuoteRequested,
  trackSwapQuoteReturned,
} from "../../analytics/swap-analytics";

const walletCliSupportedSwapCurrencyIds = new Set<string>(WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS);

function formatQuotesError(error: QuotesError): string {
  if ("minAmount" in error) {
    return `amount too low (minimum: ${error.minAmount})`;
  }
  if ("maxAmount" in error) {
    return `amount too high (maximum: ${error.maxAmount})`;
  }
  return error.code;
}

async function assertWalletCliSwapCurrencyId(id: string, role: "from" | "to"): Promise<void> {
  if (walletCliSupportedSwapCurrencyIds.has(id)) {
    return;
  }

  const token = await getCryptoAssetsStore().findTokenById(id);
  if (token && walletCliSupportedSwapCurrencyIds.has(token.parentCurrencyId)) {
    return;
  }

  throw new Error(
    `Unsupported swap ${role} currency "${id}". Wallet CLI supports: ${WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS.join(", ")} (and tokens on those chains).`,
  );
}

async function resolveSwapAccountAddress(
  wallet: WalletAdapter,
  accountInput: string,
): Promise<string> {
  const v1 = await resolveAccountDescriptorV1(accountInput);
  if (v1.type === "address") {
    return v1.address;
  }

  const descriptor = await resolveAccountDescriptor(accountInput);
  return wallet.getFreshAddress(descriptor);
}

export const swapQuoteInputSchema = z.object({
  from: z.string().min(1, "Source currency is required"),
  to: z.string().min(1, "Destination currency is required"),
  "from-account": z.string().min(1, "Source account is required"),
  "to-account": z.string().min(1, "Destination account is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type SwapQuoteInput = z.infer<typeof swapQuoteInputSchema>;

export function swapQuoteContext(input: SwapQuoteInput): OutputContext {
  return { command: "swap quote", network: input.from };
}

export async function swapQuoteCore(input: SwapQuoteInput, out: CommandOutput): Promise<void> {
  walletCliDebug(`quote: from=${input.from} to=${input.to}`);

  const flowId = swapFlowId();
  trackSwapQuoteRequested({
    flowId,
    fromCurrency: input.from,
    toCurrency: input.to,
    deviceRequired: false,
  });

  await out.run(async () => {
    await assertWalletCliSwapCurrencyId(input.from, "from");
    await assertWalletCliSwapCurrencyId(input.to, "to");

    const wallet = new WalletAdapter();

    const sendAddress = await resolveSwapAccountAddress(wallet, input["from-account"]);
    const receiveAddress = await resolveSwapAccountAddress(wallet, input["to-account"]);

    const s = out.spin("Fetching swap quotes…");
    const result = await getQuotes(
      {
        providers: [...WALLET_CLI_DEFAULT_SWAP_PROVIDERS],
        data: {
          amount: input.amount,
          uniswapOrderType: "classic",
          sendCurrencyId: input.from,
          receiveCurrencyId: input.to,
          sendAddress,
          receiveAddress,
          sendAccountId: "",
          receiveAccountId: "",
        },
      },
      { accounts: [], spotPrices: {}, locale: "en", counterValueCurrency: "USD" },
    );

    if (result.quotes.length === 0 && result.providerErrors.length > 0) {
      out.swapQuotesUnavailable("No quotes available", result.providerErrors);
    }

    if (result.quotes.length === 0 && result.errors.length > 0) {
      throw new Error(`No quotes available: ${result.errors.map(formatQuotesError).join(", ")}`);
    }

    const mapped = result.quotes.map(q => mapSwapQuoteLine(q, input.from, input.to, input.amount));
    s?.success(`${result.quotes.length} quote(s) received`);
    trackSwapQuoteReturned({
      flowId,
      fromCurrency: input.from,
      toCurrency: input.to,
      providersCount: result.quotes.length,
    });
    out.swapQuotes({ quotes: mapped, partialErrors: result.providerErrors });
  });
}

export default defineCommand({
  name: "quote",
  description: "Fetch swap quotes",
  options: {
    from: option(swapQuoteInputSchema.shape.from, {
      description:
        "Source currency ID — native (e.g. ethereum) or token <network>/erc20/<slug> (e.g. ethereum/erc20/usd_tether__erc20_)",
      short: "f",
    }),
    to: option(swapQuoteInputSchema.shape.to, {
      description:
        "Destination currency ID — native (e.g. bitcoin) or token <network>/erc20/<slug> (e.g. ethereum/erc20/usd_tether__erc20_)",
      short: "t",
    }),
    "from-account": option(swapQuoteInputSchema.shape["from-account"], {
      description: "Source account session label (used to resolve fresh address)",
    }),
    "to-account": option(swapQuoteInputSchema.shape["to-account"], {
      description: "Destination account session label (used to resolve fresh address)",
    }),
    amount: option(swapQuoteInputSchema.shape.amount, {
      description: "Amount to swap in source currency",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const input: SwapQuoteInput = {
      from: flags.from,
      to: flags.to,
      "from-account": flags["from-account"],
      "to-account": flags["to-account"],
      amount: flags.amount,
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), swapQuoteContext(input));
    await swapQuoteCore(input, out);
  },
});
