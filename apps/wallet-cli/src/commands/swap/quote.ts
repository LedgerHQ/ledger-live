import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { integrateNewAccountDescriptor } from "@ledgerhq/live-wallet/walletsync/modules/accounts";
import { getQuotes } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import { parseV1 } from "../../shared/accountDescriptor";
import { createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import {
  outputOption,
  resolveAccountDescriptor,
  resolveAccountInput,
  resolveOutputFormat,
} from "../inputs";
import { mapSwapQuoteLine } from "./quote-shared";

const DEFAULT_PROVIDERS = [
  "changelly_v2",
  "changelly",
  "cic_v2",
  "cic",
  "exodus",
  "nearintents",
  "swapsxyz",
];

type SwapAddressFlags = {
  accountFlag: "--from-account" | "--to-account";
  addressFlag: "--from-fresh-address" | "--to-fresh-address";
};

const createSwapAddressResolver = () => {
  let syncCache: ReturnType<typeof makeBridgeCacheSystem> | undefined;

  const getSyncCache = () =>
    (syncCache ??= makeBridgeCacheSystem({
      saveData: async () => {},
      getData: async () => undefined,
    }));

  const getFreshAddress = (
    account: Awaited<ReturnType<typeof integrateNewAccountDescriptor>>,
  ): string | undefined => {
    const parent = getParentAccount(account, [account]);
    if (parent?.freshAddress) return parent.freshAddress;
    if (
      "freshAddress" in account &&
      typeof account.freshAddress === "string" &&
      account.freshAddress.length > 0
    ) {
      return account.freshAddress;
    }
    return undefined;
  };

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

    const descriptorInput = await resolveAccountInput(accountInput);
    const descriptorV1 = parseV1(descriptorInput);
    if (descriptorV1.type === "address") return descriptorV1.address;

    const account = await integrateNewAccountDescriptor(
      await resolveAccountDescriptor(accountInput),
      getAccountBridge,
      getSyncCache(),
    );
    const freshAddress = getFreshAddress(account);

    if (freshAddress) {
      return freshAddress;
    }

    throw new Error(`Could not resolve a fresh address from ${accountFlag}.`);
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
      description: "Source account fresh receive address is required",
    }),
    "to-fresh-address": option(z.string().min(1).optional(), {
      description: "Destination account fresh receive address is required",
    }),
    "from-account": option(z.string().min(1).optional(), {
      description: "Source account descriptor or session label (used to resolve fresh address)",
    }),
    "to-account": option(z.string().min(1).optional(), {
      description:
        "Destination account descriptor or session label (used to resolve fresh address)",
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
      const resolveSwapAddress = createSwapAddressResolver();

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
          providers: DEFAULT_PROVIDERS,
          data: {
            amount: flags.amount,
            counterValueCurrency: "USD",
            uniswapOrderType: "classic",
            sendCurrencyId: flags.from,
            receiveCurrencyId: flags.to,
            sendAddress,
            receiveAddress,
            sendAccountId: "",
            receiveAccountId: "",
          },
        },
        { accounts: [], spotPrices: {} },
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
