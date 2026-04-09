import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { BigNumber } from "bignumber.js";
import { fetchQuotes } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/fetchQuotes";
import {
  findCryptoCurrencyByTicker,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import type {
  RawQuote,
  RawQuoteNetworkFees,
  RawQuotePayoutNetworkFees,
} from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import { spinner, colors, writeStdout } from "../../shared/ui";
import { makeEnvelope, makeErrorEnvelope } from "../../shared/response";
import { HumanFormatter } from "../../wallet/formatter";

const DEFAULT_PROVIDERS = ["changelly_v2", "oneinch", "paraswap", "exodus", "swapsxyz"];

type QuoteOutput = {
  quoteId: string | null;
  from: string;
  to: string;
  rate: number;
  providerFee: string | null;
  networkFee: string | null;
  receiveAmount: number;
  provider: string;
  amountFrom: string;
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
    amount: option(z.string().min(1, "Amount is required"), {
      description: "Amount to swap in source currency",
    }),
    format: option(z.enum(["human", "json"]).default("json"), {
      description: "Output format",
    }),
  },
  handler: async ({ flags }) => {
    const isHuman = flags.format === "human";
    const fromId = tickerToId(flags.from);
    const toId = tickerToId(flags.to);
    const spin = isHuman ? spinner("Fetching swap quotes…") : null;

    try {
      const baseURL = "https://swap-stg.ledger-test.com/v5";
      const result = await fetchQuotes(
        {
          providers: DEFAULT_PROVIDERS,
          data: {
            amount: flags.amount,
            counterValueCurrency: "USD",
            uniswapOrderType: "classic",
            sendCurrencyId: fromId,
            receiveCurrencyId: toId,
          },
        },
        baseURL,
      );

      if (result.quotes.length === 0 && result.errors.length > 0) {
        spin!.error("No quotes available");
        return;
      }

      const mapped = result.quotes.map(q => mapQuoteOutput(q, fromId, toId, flags.amount));

      if (isHuman) {
        spin!.success(`${result.quotes.length} quote(s) received`);
        mapped.forEach(m => writeStdout(formatQuoteHuman(m)));
        if (result.errors.length > 0) {
          spin!.error(colors.dim(`${result.errors.length} provider(s) returned errors:`));
          result.errors.forEach(e =>
            spin!.error(colors.dim(`  ${e.provider} (${e.type}): ${e.code} — ${e.message}`)),
          );
        }
      } else {
        writeStdout(
          JSON.stringify(makeEnvelope("swap quote", fromId, { quotes: mapped }), null, 2),
        );
      }
    } catch (err) {
      const msg = HumanFormatter.formatError(err);
      if (isHuman) {
        spin?.error(msg);
      } else {
        writeStdout(JSON.stringify(makeErrorEnvelope("swap quote", msg, fromId), null, 2));
      }
      throw err;
    }
  },
});

function tickerToId(ticker: string): string {
  const currency = findCryptoCurrencyByTicker(ticker.toUpperCase());
  if (!currency) {
    throw new Error(`Unknown currency ticker: "${ticker}"`);
  }
  return currency.id;
}

function formatFeeValue(fee: RawQuoteNetworkFees | RawQuotePayoutNetworkFees): string | null {
  if (fee.value == null) {
    return null;
  }
  const currency = findCryptoCurrencyByTicker(fee.currency);
  if (!currency) {
    return `${fee.value} ${fee.currency}`;
  }
  const unit = currency.units[0];
  return formatCurrencyUnit(unit, new BigNumber(fee.value), { showCode: true });
}

function mapQuoteOutput(
  quote: RawQuote,
  from: string,
  to: string,
  amountFrom: string,
): QuoteOutput {
  const networkFee = formatFeeValue(quote.networkFees);
  const providerFee = quote.payoutNetworkFees ? formatFeeValue(quote.payoutNetworkFees) : null;

  return {
    quoteId: quote.quoteId ?? null,
    from,
    to,
    rate: quote.exchangeRate,
    providerFee,
    networkFee,
    receiveAmount: quote.amountTo,
    provider: quote.provider,
    amountFrom,
  };
}

function formatQuoteHuman(m: QuoteOutput): string {
  return [
    colors.bold(`  ${m.from} → ${m.to}`),
    colors.bold(`    from:         ${m.amountFrom} ${m.from}`),
    colors.bold(`    to:           ${m.receiveAmount} ${m.to}`),
    colors.bold(`    rate:         1 ${m.from} = ${m.rate} ${m.to}`),
    colors.dim(`    Network fee:  ${m.networkFee ?? "n/a"}`),
    colors.dim(`    Provider fee: ${m.providerFee ?? "n/a"}`),
    colors.dim(`    Provider:     ${m.provider}`),
    m.quoteId ? colors.dim(`    Quote ID:     ${m.quoteId}`) : null,
  ]
    .filter(Boolean)
    .join("\n");
}
