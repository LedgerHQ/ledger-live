import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentIntentClient,
  createNonce,
  createSoftwareAgentIdentity,
  encodeSendIntentTlv,
  type SendIntent,
} from "@ledgerhq/agent-intent-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session, type AgentIntentProfileMeta } from "../../session/session-store";
import {
  loadAgentIntentSecretKey,
  AgentIntentCorruptKeychainError,
  AgentIntentPasswordRequiredError,
} from "../../key-ring/agent-intent-keychain";
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
import { describeAgentIntentError } from "../../agent-intent/service-errors";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";

function requireEnrolledProfile(
  session: Session,
  profileId: string,
): AgentIntentProfileMeta & { trustchainId: string } {
  const profile = session.getAgentIntentProfile(profileId);
  if (!profile) {
    throw new Error(
      `No Agent Intent profile named "${profileId}". Run \`wallet-cli agent-intent list\` to see ` +
        "your profiles, or `agent-intent enroll` to create one.",
    );
  }
  if (!profile.trustchainId) {
    throw new Error(
      `Agent Intent profile "${profileId}" is not enrolled yet. Finish enrollment with ` +
        `\`wallet-cli agent-intent complete --profile ${profileId}\` first.`,
    );
  }
  return { ...profile, trustchainId: profile.trustchainId };
}

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
    throw new Error(
      `Account "${label}" is on ${name}${env === "main" ? "" : ` ${env}`}; Agent Intent send ` +
        "intents support Ethereum mainnet accounts only.",
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

async function loadProfileIdentity(profile: AgentIntentProfileMeta) {
  let secretKey: string | null;
  try {
    secretKey = await loadAgentIntentSecretKey(profile.profileId);
  } catch (e) {
    if (
      e instanceof AgentIntentPasswordRequiredError ||
      e instanceof AgentIntentCorruptKeychainError
    ) {
      throw new Error(`${e.message} Re-enroll under a new --profile id.`, { cause: e });
    }
    throw e;
  }
  if (!secretKey) {
    throw new Error(
      `No secret key for Agent Intent profile "${profile.profileId}" in the OS keychain (missing, ` +
        "or the keychain is unavailable). Profiles don't move between machines or users — " +
        "re-enroll here under a new --profile id.",
    );
  }
  const identity = createSoftwareAgentIdentity(secretKey);
  // Catch a keychain/session mix-up locally, before the service rejects it as an issuer mismatch.
  if (identity.publicKey.toLowerCase() !== profile.publicKey.toLowerCase()) {
    throw new Error(
      `The OS-keychain key for profile "${profile.profileId}" doesn't match its recorded public ` +
        "key, so the service would reject this intent. Re-enroll under a new --profile id.",
    );
  }
  return identity;
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
      });

      let deeplink: string;
      try {
        deeplink = await client.createSendIntent(intent);
      } catch (e) {
        throw describeAgentIntentError(e, profile.profileId);
      }

      // Past this point the intent exists: never fail, or a retry would propose a duplicate.
      const intentId = intentIdFromDeeplink(deeplink);
      out.agentIntentSend({ ...summary, intentId, deeplink });
      if (!intentId) {
        writeStderr(
          "⚠ The review link has an unexpected shape, so no intent id could be extracted. " +
            "The intent was created — use the review link to find it.\n",
        );
      }
    });
  },
});
