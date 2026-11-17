import {
  canApproveSwapQuote,
  isSwapApprovalRequired,
  parseBaseUnits,
  parseErc20Approval,
} from "@ledgerhq/agent-intent-sdk";
import {
  getQuotes,
  type Quote,
  type QuotesError,
} from "@ledgerhq/live-common/wallet-api/Exchange/index";

export type AgentSwapQuote = {
  provider: string;
  receiveAmount: number;
  needsTokenApproval: boolean;
};

const PROVIDERS_WITH_A_FRONTEND_DEX_ENDPOINT: ReadonlySet<string> = new Set([
  "oneinch",
  "velora",
  "okx",
]);
const PROVIDERS_ANSWERING_WITH_CALLDATA: ReadonlySet<string> = new Set(["lifi"]);

function needsTokenApproval({ quoteDetails: { tokenAllowance, tags } }: Quote): boolean {
  return isSwapApprovalRequired({
    isApproved: tokenAllowance?.isApproved,
    isTokenApprovalRequired: tags?.isTokenApprovalRequired,
  });
}

function needsPermit(quote: Quote): boolean {
  return Boolean(quote.quoteDetails.permitData?.typedData);
}

/** Mirrors `swapsWithCalldata` in agent-intent-frontend `src/features/intents/swap/swapProviders.ts`. */
function swapsWithCalldata({ provider, providerDetails }: Quote): boolean {
  return providerDetails.type === "DEX"
    ? PROVIDERS_WITH_A_FRONTEND_DEX_ENDPOINT.has(provider)
    : PROVIDERS_ANSWERING_WITH_CALLDATA.has(provider);
}

function frontendCanApprove(quote: Quote, soldTokenContract: string | undefined): boolean {
  const allowance = quote.quoteDetails.tokenAllowance;
  const approval = parseErc20Approval(allowance?.approvalTransaction);
  return canApproveSwapQuote(
    {
      approvalRequired: needsTokenApproval(quote),
      permitRequired: needsPermit(quote),
      allowanceSpender: approval?.spender,
      allowanceToken: approval?.token,
      allowanceAmount: parseBaseUnits(allowance?.approvedAmount),
    },
    { network: "ethereum", swapsWithCalldata: swapsWithCalldata(quote), soldTokenContract },
  );
}

function isPreparable(quote: Quote, soldTokenContract: string | undefined): boolean {
  if (quote.errors.length > 0 || needsPermit(quote)) return false;
  return !needsTokenApproval(quote) || frontendCanApprove(quote, soldTokenContract);
}

function describeQuotesError(error: QuotesError): string {
  if ("minAmount" in error) return `amount too low (minimum: ${error.minAmount})`;
  if ("maxAmount" in error) return `amount too high (maximum: ${error.maxAmount})`;
  return error.code;
}

/**
 * Best quote the Agent Intent frontend can prepare for selling `amount` of `from` for `to` from
 * `sender`'s own address, among `providers`. Quotes come back best first (highest receive amount
 * when no prices are given); one that needs a token approval the frontend can send still counts.
 */
export async function fetchAgentSwapQuote(
  request: {
    from: string;
    fromContract?: string;
    to: string;
    amount: string;
    sender: string;
    providers: readonly string[];
  },
  quotes: typeof getQuotes = getQuotes,
): Promise<AgentSwapQuote> {
  const result = await quotes(
    {
      providers: [...request.providers],
      data: {
        amount: request.amount,
        uniswapOrderType: "classic",
        sendCurrencyId: request.from,
        receiveCurrencyId: request.to,
        sendAddress: request.sender,
        receiveAddress: request.sender,
        sendAccountId: "",
        receiveAccountId: "",
      },
    },
    { accounts: [], spotPrices: {}, locale: "en", counterValueCurrency: "USD" },
  );

  const quote = result.quotes.find(q => isPreparable(q, request.fromContract));
  if (quote) {
    return {
      provider: quote.provider,
      receiveAmount: quote.quoteDetails.receiveAmount,
      needsTokenApproval: needsTokenApproval(quote),
    };
  }

  if (result.quotes.length > 0) {
    throw new Error(
      "Every quote needs a Permit2 signature or a token approval the Agent Intent frontend can't " +
        "send (for example a USDT allowance that must first be reset to 0). Approve or reset the " +
        "allowance outside Agent Intent (for example from Ledger Wallet), or pick another provider " +
        "with --provider.",
    );
  }
  const reasons = [
    ...result.errors.map(describeQuotesError),
    ...result.providerErrors.map(e => `${e.provider}: ${e.message}`),
  ];
  const detail = reasons.length > 0 ? `: ${reasons.join("; ")}` : "";
  throw new Error(`No swap quote available${detail}.`);
}
