import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentIntentClient,
  createNonce,
  encodeSendIntentTlv,
  type SendIntent,
} from "@ledgerhq/agent-intent-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session } from "../../session/session-store";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { outputOption, resolveOutputFormat, resolveAccountDescriptorV1 } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { parseAmountWithTicker, parseDecimalAmount, parseEvmAddress } from "../../agent-intent/evm";
import {
  FEE_STRATEGIES,
  intentIdFromDeeplink,
  toSdkSendIntent,
  type IntentAsset,
  type SendIntentSummary,
} from "../../agent-intent/send-intent";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { keycloakOverride } from "../../agent-intent/relay";
import {
  describeAgentIntentError,
  isAcceptedWithoutReviewLink,
} from "../../agent-intent/service-errors";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

function parseSenderInput(flags: {
  account?: string;
  from?: string;
}): { account: string } | { from: string } {
  if (flags.account && !flags.from) return { account: flags.account };
  if (flags.from && !flags.account) return { from: flags.from };
  throw new Error("Pass exactly one sender: --account <session-label> or --from <address>.");
}

/** Only Ethereum mainnet accounts can send: that's the one network Agent Intent supports. */
async function resolveSenderFromAccount(label: string): Promise<string> {
  const descriptor = await resolveAccountDescriptorV1(label);
  const { name, env } = descriptor.network;
  if (name !== "ethereum" || env !== "main" || descriptor.type !== "address") {
    const network = env === "main" ? name : `${name} ${env}`;
    throw new Error(
      `Account "${label}" is on ${network}; Agent Intent send intents support Ethereum mainnet ` +
        "accounts only.",
    );
  }
  return parseEvmAddress(descriptor.address, "account");
}

async function resolveAsset(
  ticker: string,
  tokenContract: string | undefined,
): Promise<IntentAsset> {
  if (!tokenContract) {
    const eth = getCryptoCurrencyById("ethereum");
    if (ticker.toUpperCase() !== eth.ticker.toUpperCase()) {
      throw new Error(
        `--amount is in ${ticker}, but without --token the intent sends native ${eth.ticker}. ` +
          `Pass the token's contract with --token, or use '${eth.ticker}'.`,
      );
    }
    return { type: "native", ticker: eth.ticker, decimals: eth.units[0].magnitude };
  }
  const contract = parseEvmAddress(tokenContract, "token");
  const token = await findEthereumToken(contract);
  if (!token) {
    throw new Error(
      `--token ${contract} is not a known ERC-20 token on Ethereum mainnet. Check the contract ` +
        "address with `wallet-cli assets token ethereum <address>`.",
    );
  }
  if (ticker.toUpperCase() !== token.ticker.toUpperCase()) {
    throw new Error(
      `--amount is in ${ticker}, but --token ${contract} is ${token.ticker}. Fix whichever one is wrong.`,
    );
  }
  return { type: "erc20", ticker: token.ticker, decimals: token.decimals, contract };
}

/** Runs the SDK's own intent validation (description length after NFC normalization, TLV
 * encoding) without a key or network, so `--dry-run` rejects exactly what a real submit would. */
function assertSdkAcceptsIntent(intent: SendIntent): void {
  try {
    encodeSendIntentTlv(intent, createNonce());
  } catch (e) {
    throw new Error(`Invalid intent: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

export default defineCommand({
  name: "send",
  description:
    "Propose an Ethereum send (ETH or ERC-20) for human review in the Agent Intent frontend. " +
    "Never signs or broadcasts a transaction, and needs no device.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Enrolled Agent Intent profile that proposes the intent.",
    }),
    account: option(z.string().min(1).optional(), {
      description: "Sender as a session label (Ethereum mainnet account). Exclusive with --from.",
      short: "a",
    }),
    from: option(z.string().min(1).optional(), {
      description: "Sender as an explicit EVM address. Exclusive with --account.",
    }),
    to: option(z.string().min(1), { description: "Recipient EVM address." }),
    amount: option(z.string().min(1), {
      description: "Amount with ticker, e.g. '0.01 ETH' or '25 USDC'. Never rounded.",
    }),
    token: option(z.string().min(1).optional(), {
      description: "ERC-20 contract address on Ethereum mainnet (omit for native ETH).",
    }),
    "fee-strategy": option(z.enum(FEE_STRATEGIES).default("medium"), {
      description: "Fee level the human will be asked to approve.",
    }),
    description: option(z.string().min(1).max(280).optional(), {
      description: "Note shown to the human reviewer, 1-280 characters.",
    }),
    "dry-run": option(z.boolean().default(false), {
      description:
        "Validate and print the intent without submitting it (no keychain access, no sign-in).",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent send",
      network: "ethereum:main",
    });
    await out.run(async () => {
      const senderInput = parseSenderInput(flags);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const sender =
        "from" in senderInput
          ? parseEvmAddress(senderInput.from, "from")
          : await resolveSenderFromAccount(senderInput.account);
      const recipient = parseEvmAddress(flags.to, "to");
      const { amount: displayAmount, ticker } = parseAmountWithTicker(flags.amount);
      const asset = await resolveAsset(ticker, flags.token);
      const amount = parseDecimalAmount(displayAmount, asset.decimals, asset.ticker);

      const summary: SendIntentSummary = {
        profileId: profile.profileId,
        environment: profile.environment,
        sender,
        recipient,
        asset,
        amount: amount.toString(),
        displayAmount,
        feeStrategy: flags["fee-strategy"],
        description: flags.description,
      };

      const intent = toSdkSendIntent(summary);
      assertSdkAcceptsIntent(intent);

      if (flags["dry-run"]) {
        out.agentIntentSendDryRun(summary);
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
        deeplink = await client.createSendIntent(intent);
      } catch (e) {
        if (!isAcceptedWithoutReviewLink(e)) throw describeAgentIntentError(e, profile.profileId);
        deeplink = null;
      }

      // Past this point the intent exists: never fail, or a retry would propose a duplicate.
      const intentId = deeplink ? intentIdFromDeeplink(deeplink) : null;
      out.agentIntentSend({ ...summary, intentId, deeplink });
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
