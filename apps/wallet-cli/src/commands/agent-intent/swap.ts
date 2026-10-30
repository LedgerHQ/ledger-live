import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createNonce, encodeSwapIntentTlv } from "@ledgerhq/agent-intent-sdk";
import { BigNumber } from "bignumber.js";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session } from "../../session/session-store";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { resolveOutputFormat } from "../inputs";
import { parseEvmAddress } from "../../agent-intent/evm";
import {
  AGENT_INTENT_SWAP_PROVIDERS,
  parseSwapAmount,
  quotedReceiveAmount,
  resolveAgentSwapProvider,
  toSdkSwapIntent,
  warnIfTokenApprovalNeeded,
  type SwapIntentSummary,
} from "../../agent-intent/swap-intent";
import { fetchAgentSwapQuote, type AgentSwapQuote } from "../../agent-intent/swap-quote";
import { findEthereumSwapAsset, sameTicker, type SwapAsset } from "../../agent-intent/token-lookup";
import { resolveTokenByTicker } from "../../agent-intent/token-by-ticker";
import {
  parseSenderInput,
  resolveSenderAccount,
  senderFromAccount,
  type SenderAccount,
} from "../../agent-intent/sender";
import {
  assertSdkAcceptsIntent,
  proposalOptions,
  submitAgentIntent,
  warnIfReviewLinkUnusable,
} from "../../agent-intent/propose-intent";
import { createCommandOutput, type CommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

async function resolveSwapSender(
  senderInput: { account: string } | { address: string },
): Promise<{ sender: string; account: SenderAccount | undefined }> {
  if ("address" in senderInput) {
    return { sender: parseEvmAddress(senderInput.address, "sender"), account: undefined };
  }
  const account = await resolveSenderAccount(senderInput.account);
  return { sender: senderFromAccount(account, "swap", "ethereum"), account };
}

async function swapAssetId(
  value: string,
  flag: "from" | "to",
  holder: SenderAccount | undefined,
  out: Pick<CommandOutput, "withActivity">,
): Promise<string> {
  if (value.includes("/") || value === "ethereum") return value;
  const otherCurrency = findCryptoCurrencyById(value);
  if (otherCurrency) {
    throw new Error(
      `--${flag} "${value}" is the ${otherCurrency.name} currency id, not an asset on Ethereum ` +
        "mainnet. A ticker typed in uppercase is looked up as an ERC-20 token instead.",
    );
  }
  if (sameTicker(value, getCryptoCurrencyById("ethereum").ticker)) return "ethereum";
  return (await resolveTokenByTicker("ethereum", value, holder, out, flag)).id;
}

async function resolveSwapAsset(
  value: string,
  flag: "from" | "to",
  holder: SenderAccount | undefined,
  out: Pick<CommandOutput, "withActivity">,
): Promise<SwapAsset> {
  const asset = await findEthereumSwapAsset(await swapAssetId(value, flag, holder, out));
  if (!asset) {
    throw new Error(
      `--${flag} "${value}" is not ethereum or an ERC-20 token on Ethereum mainnet. Use a ticker ` +
        "such as ETH or USDC, or a Ledger currency id such as ethereum/erc20/usd__coin.",
    );
  }
  return asset;
}

const TO_AMOUNT_WARNING_PERCENT = 5;

/** A warning, not an error: the agent may know better than the quote. Compared with the unrounded
 * quote, so rounding it to the asset's precision can't trigger it. */
function warnIfAboveQuote(
  typed: string,
  { provider, receiveAmount }: AgentSwapQuote,
  quoted: string | null,
  to: SwapAsset,
): void {
  const limit = new BigNumber(receiveAmount).times(1 + TO_AMOUNT_WARNING_PERCENT / 100);
  if (limit.isFinite() && new BigNumber(typed).lte(limit)) return;
  const quote = quoted
    ? `more than ${TO_AMOUNT_WARNING_PERCENT}% above the ${provider} quote (${quoted} ${to.ticker})`
    : `above the ${provider} quote, which rounds to nothing in ${to.ticker}`;
  writeStderr(
    `⚠ --to-amount ${typed} ${to.ticker} is ${quote}; the reviewer will see a fresh quote, ` +
      "with your amount shown only as the proposal it replaced.\n",
  );
}

/** The provider and amount the intent signs: the best quote the frontend can prepare, with
 * `--to-amount` (when given) in place of the quoted amount. Quoting even then keeps the
 * provider one the frontend can turn into a transaction. */
async function expectedReceive(input: {
  toAmount: string | undefined;
  provider: string | undefined;
  from: SwapAsset;
  to: SwapAsset;
  fromAmount: string;
  sender: string;
  out: Pick<CommandOutput, "spin">;
}): Promise<{
  toAmount: string;
  provider: string;
  quoted: boolean;
  needsTokenApproval: boolean;
}> {
  const { to, provider } = input;
  const typed =
    input.toAmount === undefined ? undefined : parseSwapAmount(input.toAmount, to, "to-amount");
  const spinner = input.out.spin("Fetching swap quotes…");
  const quote = await fetchAgentSwapQuote({
    from: input.from.id,
    ...(input.from.contract ? { fromContract: input.from.contract } : {}),
    to: to.id,
    amount: input.fromAmount,
    sender: input.sender,
    providers: provider ? [provider] : AGENT_INTENT_SWAP_PROVIDERS,
  });
  spinner?.success(`Quoted by ${quote.provider}`);
  const { needsTokenApproval } = quote;
  const quoted = quotedReceiveAmount(quote.receiveAmount, to);
  if (typed) {
    warnIfAboveQuote(typed, quote, quoted, to);
    return { toAmount: typed, provider: quote.provider, quoted: false, needsTokenApproval };
  }

  if (!quoted) {
    throw new Error(
      `The ${quote.provider} quote receives less than the smallest unit of ${to.ticker}. ` +
        "Sell a larger --amount.",
    );
  }
  return { toAmount: quoted, provider: quote.provider, quoted: true, needsTokenApproval };
}

export default defineCommand({
  name: "swap",
  description:
    "Propose an Ethereum swap (ETH or ERC-20) for human review in the Agent Intent frontend, at " +
    "the best current Swap API quote. Never signs or broadcasts a transaction, and needs no device.",
  options: {
    ...proposalOptions,
    sender: option(z.string().min(1).optional(), {
      description: "Sender as an explicit EVM address. Exclusive with --account.",
    }),
    from: option(z.string().min(1), {
      description:
        "Asset to sell: a ticker such as ETH or USDC, or a Ledger currency id such as ethereum or " +
        "ethereum/erc20/usd__coin. A token ticker picks the one the --account holds or the only " +
        "one CAL lists on Ethereum mainnet, and fails if several match.",
      short: "f",
    }),
    to: option(z.string().min(1), {
      description:
        "Asset to buy, in the same form as --from. A token ticker picks the only one CAL lists on " +
        "Ethereum mainnet, whatever the --account holds, and fails if several match.",
      short: "t",
    }),
    amount: option(z.string().min(1), {
      description: "Amount of --from to sell, in its own units (e.g. 0.5). Never rounded.",
    }),
    provider: option(z.string().min(1).optional(), {
      description: `Swap API provider to quote with: ${AGENT_INTENT_SWAP_PROVIDERS.join(", ")} (default: best quote).`,
    }),
    "to-amount": option(z.string().min(1).optional(), {
      description:
        "Amount of --to to expect instead of the quoted one (the swap is still quoted, to pick a " +
        "provider the frontend can prepare). Never rounded.",
    }),
    "dry-run": option(z.boolean().default(false), {
      description:
        "Quote, validate and print the intent without submitting it (never reads the agent key or " +
        "signs in to Agent Intent).",
      argumentKind: "flag",
    }),
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent swap",
      network: "ethereum",
    });
    await out.run(async () => {
      const senderInput = parseSenderInput(
        { account: flags.account, address: flags.sender },
        "sender",
      );
      const provider = flags.provider ? resolveAgentSwapProvider(flags.provider) : undefined;
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const { sender, account } = await resolveSwapSender(senderInput);
      const from = await resolveSwapAsset(flags.from, "from", account, out);
      const to = await resolveSwapAsset(flags.to, "to", undefined, out);
      if (from.id === to.id) throw new Error("--from and --to are the same asset.");
      const fromAmount = parseSwapAmount(flags.amount, from, "amount");
      const receive = await expectedReceive({
        toAmount: flags["to-amount"],
        provider,
        from,
        to,
        fromAmount,
        sender,
        out,
      });

      const summary: SwapIntentSummary = {
        profileId: profile.profileId,
        environment: profile.environment,
        sender,
        from,
        to,
        fromAmount,
        ...receive,
        description: flags.description,
      };

      const intent = toSdkSwapIntent(summary);
      assertSdkAcceptsIntent(() => encodeSwapIntentTlv(intent, createNonce()));

      if (flags["dry-run"]) {
        out.agentIntentSwapDryRun(summary);
        warnIfTokenApprovalNeeded(summary);
        return;
      }

      const submitted = await submitAgentIntent(profile, client => client.createSwapIntent(intent));
      out.agentIntentSwap({ ...summary, ...submitted });
      warnIfTokenApprovalNeeded(summary);
      warnIfReviewLinkUnusable(submitted);
    });
  },
});
