import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createNonce, encodeSendIntentTlv, type FeeStrategy } from "@ledgerhq/agent-intent-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session } from "../../session/session-store";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { resolveOutputFormat } from "../inputs";
import { parseAmountWithTicker, parseDecimalAmount, parseEvmAddress } from "../../agent-intent/evm";
import {
  FEE_STRATEGIES,
  toSdkSendIntent,
  type EthereumAsset,
  type IntentNetwork,
  type NetworkAsset,
  type SendIntentSummary,
  type SolanaAsset,
} from "../../agent-intent/send-intent";
import {
  findEthereumToken,
  findSolanaMintProgram,
  findSolanaToken,
} from "../../agent-intent/token-lookup";
import { parseSenderInput, resolveSenderFromAccount } from "../../agent-intent/sender";
import {
  assertSdkAcceptsIntent,
  proposalOptions,
  submitAgentIntent,
  warnIfReviewLinkUnusable,
} from "../../agent-intent/propose-intent";
import { createCommandOutput } from "../../output";

/**
 * `--token` picks the network by its shape: a `0x` contract is an ERC-20 on Ethereum, anything else
 * an SPL mint on Solana. Without it, the SOL ticker proposes a native Solana send and any other an
 * Ethereum one. Read before the output is set up, so it never throws: a malformed `--amount` is
 * reported by the full parse inside the command.
 */
function networkOf(flags: { amount: string; token?: string }): IntentNetwork {
  if (flags.token) return /^0x/i.test(flags.token) ? "ethereum" : "solana";
  try {
    const { ticker } = parseAmountWithTicker(flags.amount);
    return ticker.toUpperCase() === solanaAsset().ticker.toUpperCase() ? "solana" : "ethereum";
  } catch {
    return "ethereum";
  }
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
  common: Omit<SendIntentSummary, "network" | "asset" | "feeStrategy" | "memo">,
  networkAsset: NetworkAsset,
  flags: { "fee-strategy"?: FeeStrategy; memo?: string },
): SendIntentSummary {
  if (networkAsset.network === "solana")
    return { ...common, ...networkAsset, ...(flags.memo ? { memo: flags.memo } : {}) };
  return { ...common, ...networkAsset, feeStrategy: flags["fee-strategy"] ?? "medium" };
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
  senderInput: { account: string } | { address: string },
  to: string,
): Promise<SendParties> {
  const recipient = network === "ethereum" ? parseEvmAddress(to, "to") : to;
  if ("account" in senderInput) {
    return {
      sender: await resolveSenderFromAccount(senderInput.account, "send", network),
      recipient,
      senderField: `account "${senderInput.account}"`,
    };
  }
  const sender =
    network === "ethereum" ? parseEvmAddress(senderInput.address, "from") : senderInput.address;
  return { sender, recipient, senderField: "--from" };
}

function solanaAsset(): SolanaAsset {
  const sol = getCryptoCurrencyById("solana");
  return { type: "native", ticker: sol.ticker, decimals: sol.units[0].magnitude };
}

async function resolveEthereumAsset(
  ticker: string,
  tokenContract: string | undefined,
): Promise<EthereumAsset> {
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

async function resolveSplToken(ticker: string, mint: string): Promise<SolanaAsset> {
  const token = await findSolanaToken(mint);
  if (!token) {
    throw new Error(
      `--token ${mint} is not a known SPL token on Solana mainnet. Check the mint address with ` +
        "`wallet-cli assets token solana <mint>`.",
    );
  }
  if (ticker.toUpperCase() !== token.ticker.toUpperCase()) {
    throw new Error(
      `--amount is in ${ticker}, but --token ${mint} is ${token.ticker}. Fix whichever one is wrong.`,
    );
  }
  // Fails closed: a mint the node can't confirm as a classic SPL token is refused too.
  const program = await findSolanaMintProgram(token.mint);
  if (program !== "spl-token") {
    throw new Error(
      program === "spl-token-2022"
        ? `--token ${mint} (${token.ticker}) is a Token-2022 mint, which Agent Intent can't send yet.`
        : `--token ${mint} (${token.ticker}) isn't a mint of the SPL Token program on Solana mainnet.`,
    );
  }
  return { type: "spl-token", ticker: token.ticker, decimals: token.decimals, mint: token.mint };
}

/** On Solana, SOL or the SPL token that `--token` names; on Ethereum, ETH or the ERC-20 it names. */
async function resolveNetworkAsset(
  network: IntentNetwork,
  ticker: string,
  token: string | undefined,
): Promise<NetworkAsset> {
  if (network === "ethereum") {
    return { network, asset: await resolveEthereumAsset(ticker, token) };
  }
  return { network, asset: token ? await resolveSplToken(ticker, token) : solanaAsset() };
}

export default defineCommand({
  name: "send",
  description:
    "Propose an Ethereum send (ETH or ERC-20) or a Solana send (SOL or SPL token) for human " +
    "review in the Agent Intent frontend. Never signs or broadcasts a transaction, and needs no " +
    "device.",
  options: {
    ...proposalOptions,
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
      description:
        "Token to send: an ERC-20 contract (0x…, Ethereum mainnet) or an SPL token mint (base58, " +
        "Solana mainnet). Omit for native ETH or SOL.",
    }),
    "fee-strategy": option(z.enum(FEE_STRATEGIES).optional(), {
      description:
        "Fee level the human will be asked to approve (Ethereum only, default medium). Solana sets its own fee.",
    }),
    memo: option(z.string().min(1).max(280).optional(), {
      description: "Memo carried on chain with the transfer, 1-280 characters (Solana only).",
    }),
    "dry-run": option(z.boolean().default(false), {
      description:
        "Validate and print the intent without submitting it (no keychain access, no sign-in).",
      argumentKind: "flag",
    }),
  },
  handler: async ({ flags }) => {
    const network = networkOf(flags);
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent send",
      network: `${network}:main`,
    });
    await out.run(async () => {
      const senderInput = parseSenderInput({ account: flags.account, address: flags.from }, "from");
      assertNetworkFlags(network, flags);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const { sender, recipient, senderField } = await resolveParties(
        network,
        senderInput,
        flags.to,
      );
      const { amount: displayAmount, ticker } = parseAmountWithTicker(flags.amount);
      const networkAsset = await resolveNetworkAsset(network, ticker, flags.token);
      const { asset } = networkAsset;
      const amount = parseDecimalAmount(displayAmount, asset.decimals, asset.ticker);

      const common = {
        profileId: profile.profileId,
        environment: profile.environment,
        sender,
        recipient,
        amount: amount.toString(),
        displayAmount,
        description: flags.description,
      };
      const summary = withNetworkFields(common, networkAsset, flags);

      const intent = toSdkSendIntent(summary);
      assertSdkAcceptsIntent(() => encodeSendIntentTlv(intent, createNonce()), {
        sender: senderField,
        recipient: "--to",
      });

      if (flags["dry-run"]) {
        out.agentIntentSendDryRun(summary);
        return;
      }

      const submitted = await submitAgentIntent(profile, client => client.createSendIntent(intent));
      out.agentIntentSend({ ...summary, ...submitted });
      warnIfReviewLinkUnusable(submitted);
    });
  },
});
