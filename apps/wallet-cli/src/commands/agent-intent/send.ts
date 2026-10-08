import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import {
  createAgentIntentClient,
  createNonce,
  encodeSendIntentTlv,
  type FeeStrategy,
  type SendIntent,
} from "@ledgerhq/agent-intent-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session, type AgentIntentProfileMeta } from "../../session/session-store";
import { outputOption, resolveOutputFormat, resolveAccountDescriptorV1 } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { parseAmountWithTicker, parseDecimalAmount, parseEvmAddress } from "../../agent-intent/evm";
import {
  FEE_STRATEGIES,
  intentIdFromDeeplink,
  toSdkSendIntent,
  type IntentAsset,
  type IntentNetwork,
  type SendIntentSummary,
} from "../../agent-intent/send-intent";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { loadProfileIdentity } from "../../agent-intent/profile-identity";
import { assertStoredServiceUrl, keycloakOverride } from "../../agent-intent/relay";
import {
  describeAgentIntentError,
  isAcceptedWithoutReviewLink,
} from "../../agent-intent/service-errors";
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
      `Agent Intent profile "${profileId}" is not enrolled yet — approve its \`agent-intent ` +
        "enroll` link first, or enroll a fresh profile if that link expired.",
    );
  }
  // Re-checked here: the signed-in request sends an access token to these hosts.
  assertStoredServiceUrl(profileId, profile.bffBaseUrl, "bff-url", "BFF URL");
  if (profile.keycloakBaseUrl !== undefined) {
    assertStoredServiceUrl(profileId, profile.keycloakBaseUrl, "keycloak-url", "Keycloak URL");
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

/**
 * Native SOL (the SOL ticker without `--token`) proposes a Solana send; anything else, including
 * an ERC-20 whose ticker is SOL, an Ethereum one. Read before the output is set up, so it never
 * throws: a malformed `--amount` is reported by the full parse inside the command.
 */
function networkOf(flags: { amount: string; token?: string }): IntentNetwork {
  if (flags.token) return "ethereum";
  try {
    const { ticker } = parseAmountWithTicker(flags.amount);
    return ticker.toUpperCase() === solanaAsset().ticker.toUpperCase() ? "solana" : "ethereum";
  } catch {
    return "ethereum";
  }
}

const SEND_INTENT_OF: Record<IntentNetwork, string> = {
  ethereum: "an Ethereum send intent needs an Ethereum mainnet account",
  solana: "a Solana send intent needs a Solana mainnet account",
};

/** Only mainnet address accounts can send, on the network the amount's ticker selected. */
async function resolveSenderFromAccount(label: string, network: IntentNetwork): Promise<string> {
  const descriptor = await resolveAccountDescriptorV1(label);
  const { name, env } = descriptor.network;
  if (name !== network || env !== "main" || descriptor.type !== "address") {
    const actual = env === "main" ? name : `${name} ${env}`;
    throw new Error(`Account "${label}" is on ${actual}; ${SEND_INTENT_OF[network]}.`);
  }
  return network === "ethereum"
    ? parseEvmAddress(descriptor.address, "account")
    : descriptor.address;
}

/** A Solana send has no fee level (the service sets the priority fee); a memo is Solana only. */
function assertNetworkFlags(
  network: IntentNetwork,
  flags: { "fee-strategy"?: string; memo?: string },
): void {
  if (network === "solana" && flags["fee-strategy"]) {
    throw new Error("--fee-strategy is Ethereum only: on Solana the service sets the fee.");
  }
  if (network === "ethereum" && flags.memo) throw new Error("--memo is Solana only.");
}

/** Adds what only one network carries: a fee level on Ethereum, a memo on Solana. */
function withNetworkFields(
  common: Omit<SendIntentSummary, "network" | "feeStrategy" | "memo">,
  network: IntentNetwork,
  flags: { "fee-strategy"?: FeeStrategy; memo?: string },
): SendIntentSummary {
  if (network === "solana")
    return { ...common, network, ...(flags.memo ? { memo: flags.memo } : {}) };
  return { ...common, network, feeStrategy: flags["fee-strategy"] ?? "medium" };
}

type SendParties = {
  sender: string;
  recipient: string;
  /** How the sender was given, to name it when the SDK refuses its address. */
  senderField: string;
};

/** Solana addresses are checked by the SDK later: canonical base58, 32 bytes. */
async function resolveParties(
  network: IntentNetwork,
  senderInput: { account: string } | { from: string },
  to: string,
): Promise<SendParties> {
  const recipient = network === "ethereum" ? parseEvmAddress(to, "to") : to;
  if ("account" in senderInput) {
    return {
      sender: await resolveSenderFromAccount(senderInput.account, network),
      recipient,
      senderField: `account "${senderInput.account}"`,
    };
  }
  const sender =
    network === "ethereum" ? parseEvmAddress(senderInput.from, "from") : senderInput.from;
  return { sender, recipient, senderField: "--from" };
}

function solanaAsset(): IntentAsset {
  const sol = getCryptoCurrencyById("solana");
  return { type: "native", ticker: sol.ticker, decimals: sol.units[0].magnitude };
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
          `Pass the token's contract with --token, use '${eth.ticker}', or use '${solanaAsset().ticker}' ` +
          "for a Solana send.",
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

/** Native SOL on Solana; on Ethereum, ETH or the ERC-20 that `--token` names. */
function resolveNetworkAsset(
  network: IntentNetwork,
  ticker: string,
  tokenContract: string | undefined,
): Promise<IntentAsset> {
  return network === "solana"
    ? Promise.resolve(solanaAsset())
    : resolveAsset(ticker, tokenContract);
}

/** Runs the SDK's own intent validation (description length after NFC normalization, TLV
 * encoding) without a key or network, so `--dry-run` rejects exactly what a real submit would. */
function assertSdkAcceptsIntent(
  intent: SendIntent,
  fields: { sender: string; recipient: string },
): void {
  try {
    encodeSendIntentTlv(intent, createNonce());
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).replace(
      /^(sender|recipient)\b/,
      field => fields[field as "sender" | "recipient"],
    );
    throw new Error(`Invalid intent: ${message}`, { cause: e });
  }
}

export default defineCommand({
  name: "send",
  description:
    "Propose an Ethereum send (ETH or ERC-20) or a Solana send (SOL) for human review in the " +
    "Agent Intent frontend. Never signs or broadcasts a transaction, and needs no device.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Enrolled Agent Intent profile that proposes the intent.",
    }),
    account: option(z.string().min(1).optional(), {
      description:
        "Sender as a session label (Ethereum or Solana mainnet account). Exclusive with --from.",
      short: "a",
    }),
    from: option(z.string().min(1).optional(), {
      description:
        "Sender as an explicit address (EVM, or base58 for Solana). Exclusive with --account.",
    }),
    to: option(z.string().min(1), {
      description: "Recipient address (EVM, or base58 for Solana).",
    }),
    amount: option(z.string().min(1), {
      description:
        "Amount with ticker, e.g. '0.01 ETH', '25 USDC' or '0.5 SOL' (SOL proposes a Solana send). " +
        "Never rounded.",
    }),
    token: option(z.string().min(1).optional(), {
      description: "ERC-20 contract address on Ethereum mainnet (omit for native ETH or SOL).",
    }),
    "fee-strategy": option(z.enum(FEE_STRATEGIES).optional(), {
      description:
        "Fee level the human will be asked to approve (Ethereum only, default medium). Solana sets its own fee.",
    }),
    memo: option(z.string().min(1).max(280).optional(), {
      description: "Memo carried on chain with the transfer, 1-280 characters (Solana only).",
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
    const network = networkOf(flags);
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent send",
      network: `${network}:main`,
    });
    await out.run(async () => {
      const senderInput = parseSenderInput(flags);
      assertNetworkFlags(network, flags);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const { sender, recipient, senderField } = await resolveParties(
        network,
        senderInput,
        flags.to,
      );
      const { amount: displayAmount, ticker } = parseAmountWithTicker(flags.amount);
      const asset = await resolveNetworkAsset(network, ticker, flags.token);
      const amount = parseDecimalAmount(displayAmount, asset.decimals, asset.ticker);

      const common = {
        profileId: profile.profileId,
        environment: profile.environment,
        sender,
        recipient,
        asset,
        amount: amount.toString(),
        displayAmount,
        description: flags.description,
      };
      const summary = withNetworkFields(common, network, flags);

      const intent = toSdkSendIntent(summary);
      assertSdkAcceptsIntent(intent, { sender: senderField, recipient: "--to" });

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
