import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getQuotes } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import { WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS } from "../../live-common-setup";
import { createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { WalletAdapter } from "../../wallet";
import {
  outputOption,
  resolveAccountDescriptor,
  resolveAccountDescriptorV1,
  resolveOutputFormat,
} from "../inputs";
import { mapSwapQuoteLine, WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./quote-shared";

const walletCliSupportedSwapCurrencyIds = new Set<string>(WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS);

async function assertWalletCliSwapCurrencyId(id: string, role: "from" | "to"): Promise<void> {
  if (walletCliSupportedSwapCurrencyIds.has(id)) {
    return;
  }

  const token = await getCryptoAssetsStore().findTokenById(id);
  if (token && walletCliSupportedSwapCurrencyIds.has(token.parentCurrency.id)) {
    return;
  }

  throw new Error(
    `Unsupported swap ${role} currency "${id}". Wallet CLI supports: ${WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS.join(", ")} (and tokens on those chains).`,
  );
}

type SwapAddressFlags = {
  accountFlag: "--from-account" | "--to-account";
  addressFlag: "--from-fresh-address" | "--to-fresh-address";
};

const createSwapAddressResolver = (wallet: WalletAdapter) => {
  return async (
    directAddress: string | undefined,
    accountInput: string | undefined,
    { addressFlag, accountFlag }: SwapAddressFlags,
  ): Promise<string> => {
    if (directAddress) {
      return directAddress;
    }

    if (!accountInput) {
      throw new Error(`Missing ${addressFlag}. Use ${addressFlag} or ${accountFlag}.`);
    }

    const v1 = await resolveAccountDescriptorV1(accountInput);
    if (v1.type === "address") {
      return v1.address;
    }

    const descriptor = await resolveAccountDescriptor(accountInput);
    return wallet.getFreshAddress(descriptor);
  };
};

export default defineCommand({
  name: "quote",
  description: "Fetch swap quotes",
  options: {
    from: option(z.string().min(1, "Source currency is required"), {
      description: "Source currency ID",
      short: "f",
    }),
    to: option(z.string().min(1, "Destination currency is required"), {
      description: "Destination currency ID",
      short: "t",
    }),
    "from-fresh-address": option(z.string().min(1).optional(), {
      description: "Source account fresh receive address (alternative to --from-account)",
    }),
    "to-fresh-address": option(z.string().min(1).optional(), {
      description: "Destination account fresh receive address (alternative to --to-account)",
    }),
    "from-account": option(z.string().min(1).optional(), {
      description: "Source account session label (used to resolve fresh address)",
    }),
    "to-account": option(z.string().min(1).optional(), {
      description:
        "Destination account session label (used to resolve fresh address)",
    }),
    amount: option(z.string().min(1, "Amount is required"), {
      description: "Amount to swap in source currency",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const output = resolveOutputFormat(flags.output);
    walletCliDebug(`quote: from=${flags.from} to=${flags.to} output=${output}`);
    const out = createCommandOutput(output, { command: "swap quote", network: flags.from });

    await out.run(async () => {
      await assertWalletCliSwapCurrencyId(flags.from, "from");
      await assertWalletCliSwapCurrencyId(flags.to, "to");

      const wallet = new WalletAdapter();
      const resolveSwapAddress = createSwapAddressResolver(wallet);

      const sendAddress = await resolveSwapAddress(
        flags["from-fresh-address"],
        flags["from-account"],
        { addressFlag: "--from-fresh-address", accountFlag: "--from-account" },
      );
      const receiveAddress = await resolveSwapAddress(
        flags["to-fresh-address"],
        flags["to-account"],
        { addressFlag: "--to-fresh-address", accountFlag: "--to-account" },
      );

      const s = out.spin("Fetching swap quotes…");
      const result = await getQuotes(
        {
          providers: [...WALLET_CLI_DEFAULT_SWAP_PROVIDERS],
          data: {
            amount: flags.amount,
            uniswapOrderType: "classic",
            sendCurrencyId: flags.from,
            receiveCurrencyId: flags.to,
            sendAddress,
            receiveAddress,
            sendAccountId: "",
            receiveAccountId: "",
          },
        },
        { accounts: [], spotPrices: {}, locale: "en", counterValueCurrency: "USD" },
      );

      if (result.quotes.length === 0 && result.errors.length > 0) {
        out.swapQuotesUnavailable("No quotes available", result.errors);
      }

      const mapped = result.quotes.map(q =>
        mapSwapQuoteLine(q, flags.from, flags.to, flags.amount),
      );
      s?.success(`${result.quotes.length} quote(s) received`);
      out.swapQuotes({ quotes: mapped, partialErrors: result.errors });
    });
  },
});
