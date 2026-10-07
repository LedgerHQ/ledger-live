import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentIntentClient,
  createNonce,
  encodeSwapIntentTlv,
  type SwapIntent,
} from "@ledgerhq/agent-intent-sdk";
import { Session } from "../../session/session-store";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { parseEvmAddress } from "../../agent-intent/evm";
import { intentIdFromDeeplink } from "../../agent-intent/send-intent";
import {
  AGENT_INTENT_SWAP_PROVIDERS,
  parseSwapAmount,
  quotedReceiveAmount,
  resolveAgentSwapProvider,
  toSdkSwapIntent,
  type SwapIntentSummary,
} from "../../agent-intent/swap-intent";
import { fetchAgentSwapQuote } from "../../agent-intent/swap-quote";
import { findEthereumSwapAsset, type SwapAsset } from "../../agent-intent/token-lookup";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { resolveSenderFromAccount } from "../../agent-intent/sender";
import { keycloakOverride } from "../../agent-intent/relay";
import {
  describeAgentIntentError,
  isAcceptedWithoutReviewLink,
} from "../../agent-intent/service-errors";
import { createCommandOutput, type CommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

function parseSenderInput(flags: {
  account?: string;
  sender?: string;
}): { account: string } | { sender: string } {
  if (flags.account && !flags.sender) return { account: flags.account };
  if (flags.sender && !flags.account) return { sender: flags.sender };
  throw new Error("Pass exactly one sender: --account <session-label> or --sender <address>.");
}

async function resolveSwapAsset(id: string, flag: "from" | "to"): Promise<SwapAsset> {
  const asset = await findEthereumSwapAsset(id);
  if (!asset) {
    throw new Error(
      `--${flag} "${id}" is not ethereum or an ERC-20 token on Ethereum mainnet. Use a Ledger ` +
        "currency id such as ethereum or ethereum/erc20/usd__coin.",
    );
  }
  return asset;
}

/** Runs the SDK's own Swap validation without a key or network, so `--dry-run` rejects exactly
 * what a real submit would. */
function assertSdkAcceptsIntent(intent: SwapIntent): void {
  try {
    encodeSwapIntentTlv(intent, createNonce());
  } catch (e) {
    throw new Error(`Invalid intent: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
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
}): Promise<{ toAmount: string; provider: string; quoted: boolean }> {
  const { to, provider } = input;
  const typed =
    input.toAmount === undefined ? undefined : parseSwapAmount(input.toAmount, to, "to-amount");
  const spinner = input.out.spin("Fetching swap quotes…");
  const quote = await fetchAgentSwapQuote({
    from: input.from.id,
    to: to.id,
    amount: input.fromAmount,
    sender: input.sender,
    providers: provider ? [provider] : AGENT_INTENT_SWAP_PROVIDERS,
  });
  spinner?.success(`Quoted by ${quote.provider}`);
  if (typed) return { toAmount: typed, provider: quote.provider, quoted: false };

  const quoted = quotedReceiveAmount(quote.receiveAmount, to);
  if (!quoted) {
    throw new Error(
      `The ${quote.provider} quote receives less than the smallest unit of ${to.ticker}. ` +
        "Sell a larger --amount.",
    );
  }
  return { toAmount: quoted, provider: quote.provider, quoted: true };
}

export default defineCommand({
  name: "swap",
  description:
    "Propose an Ethereum swap (ETH or ERC-20) for human review in the Agent Intent frontend, at " +
    "the best current Swap API quote. Never signs or broadcasts a transaction, and needs no device.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Enrolled Agent Intent profile that proposes the intent.",
    }),
    account: option(z.string().min(1).optional(), {
      description: "Sender as a session label (Ethereum mainnet account). Exclusive with --sender.",
      short: "a",
    }),
    sender: option(z.string().min(1).optional(), {
      description: "Sender as an explicit EVM address. Exclusive with --account.",
    }),
    from: option(z.string().min(1), {
      description:
        "Currency id to sell: ethereum or an ERC-20 id such as ethereum/erc20/usd__coin.",
      short: "f",
    }),
    to: option(z.string().min(1), {
      description: "Currency id to buy, in the same form as --from.",
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
    description: option(z.string().min(1).max(280).optional(), {
      description: "Note shown to the human reviewer, 1-280 characters.",
    }),
    "dry-run": option(z.boolean().default(false), {
      description:
        "Quote, validate and print the intent without submitting it (never reads the agent key or " +
        "signs in to Agent Intent).",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent swap",
      network: "ethereum:main",
    });
    await out.run(async () => {
      const senderInput = parseSenderInput(flags);
      const provider = flags.provider ? resolveAgentSwapProvider(flags.provider) : undefined;
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const sender =
        "sender" in senderInput
          ? parseEvmAddress(senderInput.sender, "sender")
          : await resolveSenderFromAccount(senderInput.account, "swap");
      const from = await resolveSwapAsset(flags.from, "from");
      const to = await resolveSwapAsset(flags.to, "to");
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
      assertSdkAcceptsIntent(intent);

      if (flags["dry-run"]) {
        out.agentIntentSwapDryRun(summary);
        return;
      }

      const client = createAgentIntentClient({
        bffBaseUrl: profile.bffBaseUrl,
        identity: await loadProfileIdentity(profile),
        trustchainId: profile.trustchainId,
        environment: profile.environment,
        ...keycloakOverride(profile.environment, profile.keycloakBaseUrl),
      });

      let deeplink: string | null;
      try {
        deeplink = await client.createSwapIntent(intent);
      } catch (e) {
        if (!isAcceptedWithoutReviewLink(e)) throw describeAgentIntentError(e, profile.profileId);
        deeplink = null;
      }

      // Past this point the intent exists: never fail, or a retry would propose a duplicate.
      const intentId = deeplink ? intentIdFromDeeplink(deeplink) : null;
      out.agentIntentSwap({ ...summary, intentId, deeplink });
      if (!deeplink) {
        writeStderr(
          "⚠ The Agent Intent service accepted the intent but returned no readable review link. " +
            "Find it in the Agent Intent frontend — don't re-run, or you'll propose a duplicate.\n",
        );
      } else if (!intentId) {
        writeStderr(
          "⚠ The review link has an unexpected shape, so no intent id could be extracted. " +
            "The intent was created — use the review link to find it.\n",
        );
      }
    });
  },
});
