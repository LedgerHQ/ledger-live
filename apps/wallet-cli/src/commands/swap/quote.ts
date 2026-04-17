import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getQuotes } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/getQuotes";
import { findCryptoCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { outputOption } from "../shared-options";
import { mapSwapQuoteLine } from "./quote-shared";

const DEFAULT_PROVIDERS = ["changelly_v2", "oneinch", "paraswap", "exodus", "swapsxyz"];

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
    "from-fresh-address": option(z.string().min(1), {
      description: "Source account fresh receive address is required",
    }),
    "to-fresh-address": option(z.string().min(1), {
      description: "Destination account fresh receive address is required",
    }),
    amount: option(z.string().min(1, "Amount is required"), {
      description: "Amount to swap in source currency",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    walletCliDebug(`quote: from=${flags.from} to=${flags.to} output=${flags.output}`);
    const out = createCommandOutput(flags.output, { command: "swap quote", network: flags.from });

    await out.run(async () => {
      const s = out.spin("Fetching swap quotes…");
      const result = await getQuotes({
        providers: DEFAULT_PROVIDERS,
        data: {
          amount: flags.amount,
          counterValueCurrency: "USD",
          uniswapOrderType: "classic",
          sendCurrencyId: flags.from,
          receiveCurrencyId: flags.to,
          sendAddress: flags["from-fresh-address"],
          receiveAddress: flags["to-fresh-address"],
        },
      });

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
