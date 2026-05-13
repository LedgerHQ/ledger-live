import type { Quote } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { colors } from "../../shared/ui";

export { WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./providers";

/** Serializable quote line for JSON envelopes and human formatting. */
export type SwapQuoteLine = {
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

/** Provider error row from the swap quote API (subset used by the CLI). */
export type SwapQuoteProviderError = {
  code: string;
  type: "float" | "fixed";
  provider: string;
  message: string;
  parameter: { [key: string]: string };
};

function formatNetworkFeesDisplay(
  networkFees: Quote["quoteDetails"]["networkFees"],
): string | null {
  const cur = findCryptoCurrencyById(networkFees.currencyId);
  const label = cur?.ticker ?? networkFees.currencyId;
  if (networkFees.gasLimit) {
    return `gas ${networkFees.gasLimit} (${label})`;
  }
  return label;
}

export function mapSwapQuoteLine(
  quote: Quote,
  from: string,
  to: string,
  amountFrom: string,
): SwapQuoteLine {
  const { quoteDetails } = quote;

  return {
    quoteId: quote.id ?? null,
    from,
    to,
    rate: quoteDetails.exchangeRate,
    providerFee: null,
    networkFee: formatNetworkFeesDisplay(quoteDetails.networkFees),
    receiveAmount: quoteDetails.receiveAmount,
    provider: quote.provider,
    amountFrom,
  };
}

export function formatSwapQuoteHuman(m: SwapQuoteLine): string {
  return [
    colors.bold(`  ${m.from} → ${m.to}`),
    colors.bold(`    from:         ${m.amountFrom} ${m.from}`),
    colors.bold(`    to:           ${m.receiveAmount} ${m.to}`),
    colors.bold(`    rate:         1 ${m.from} = ${m.rate} ${m.to}`),
    colors.dim(`    Provider:     ${m.provider}`),
    m.quoteId ? colors.dim(`    Quote ID:     ${m.quoteId}`) : null,
  ]
    .filter(Boolean)
    .join("\n");
}
