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
  sameTicker,
} from "../../agent-intent/token-lookup";
import {
  parseSenderInput,
  resolveSenderAccount,
  senderFromAccount,
  type SenderAccount,
} from "../../agent-intent/sender";
import { resolveTokenByTicker } from "../../agent-intent/token-by-ticker";
import {
  assertSdkAcceptsIntent,
  proposalOptions,
  submitAgentIntent,
  warnIfReviewLinkUnusable,
} from "../../agent-intent/propose-intent";
import { createCommandOutput, type CommandOutput } from "../../output";
import { mainnetOf } from "../../shared/accountDescriptor";

const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type SenderInput = { account: SenderAccount } | { address: string };

function networkOfAddress(address: string, flag: "from" | "token"): IntentNetwork {
  if (/^0x/i.test(address)) return "ethereum";
  if (BASE58_ADDRESS.test(address)) return "solana";
  throw new Error(
    `--${flag} ${address} is neither an EVM address (0x…) nor a Solana one (base58), so it names no ` +
      "network for the token.",
  );
}

function nativeNetworkOf(ticker: string): IntentNetwork | undefined {
  if (sameTicker(ticker, solanaAsset().ticker)) return "solana";
  if (sameTicker(ticker, ethereumAsset().ticker)) return "ethereum";
  return undefined;
}

/** `--token`'s network by its shape, else ETH's or SOL's, and only then the sender's. */
function networkOf(
  ticker: string,
  token: string | undefined,
  senderInput: SenderInput,
): IntentNetwork {
  if (token) return networkOfAddress(token, "token");
  const nativeNetwork = nativeNetworkOf(ticker);
  if ("address" in senderInput) {
    return nativeNetwork ?? networkOfAddress(senderInput.address, "from");
  }
  const { label, descriptor } = senderInput.account;
  const accountMainnet = mainnetOf(descriptor.network);
  if (!nativeNetwork) return accountMainnet === "solana" ? "solana" : "ethereum";
  const otherIntentNetwork = nativeNetwork === "solana" ? "ethereum" : "solana";
  if (accountMainnet === otherIntentNetwork) {
    const native = getCryptoCurrencyById(nativeNetwork);
    throw new Error(
      `Account "${label}" is on ${descriptor.network}, but ${native.ticker} is a native ` +
        `${native.name} send. To send a token with that ticker from this account, pass its ` +
        "address with --token.",
    );
  }
  return nativeNetwork;
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
function resolveParties(network: IntentNetwork, senderInput: SenderInput, to: string): SendParties {
  const recipient = network === "ethereum" ? parseEvmAddress(to, "to") : to;
  if ("account" in senderInput) {
    return {
      sender: senderFromAccount(senderInput.account, "send", network),
      recipient,
      senderField: `account "${senderInput.account.label}"`,
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

function ethereumAsset(): EthereumAsset {
  const eth = getCryptoCurrencyById("ethereum");
  return { type: "native", ticker: eth.ticker, decimals: eth.units[0].magnitude };
}

async function resolveErc20(
  ticker: string,
  tokenContract: string,
  fromTokenFlag: boolean,
): Promise<EthereumAsset> {
  const contract = parseEvmAddress(tokenContract, "token");
  const label = fromTokenFlag ? `--token ${contract}` : contract;
  const token = await findEthereumToken(contract);
  if (!token) {
    throw new Error(
      `${label} is not a known ERC-20 token on Ethereum mainnet. Check the contract ` +
        "address with `wallet-cli assets token ethereum <address>`.",
    );
  }
  if (!sameTicker(ticker, token.ticker)) {
    throw new Error(
      `--amount is in ${ticker}, but ${label} is ${token.ticker}. Fix whichever one is wrong.`,
    );
  }
  return { type: "erc20", ticker: token.ticker, decimals: token.decimals, contract };
}

async function resolveSplToken(
  ticker: string,
  mint: string,
  fromTokenFlag: boolean,
): Promise<SolanaAsset> {
  const label = fromTokenFlag ? `--token ${mint}` : mint;
  const token = await findSolanaToken(mint);
  if (!token) {
    throw new Error(
      `${label} is not a known SPL token on Solana mainnet. Check the mint address with ` +
        "`wallet-cli assets token solana <mint>`.",
    );
  }
  if (!sameTicker(ticker, token.ticker)) {
    throw new Error(
      `--amount is in ${ticker}, but ${label} is ${token.ticker}. Fix whichever one is wrong.`,
    );
  }
  // Fails closed: a mint the node can't confirm as a classic SPL token is refused too.
  const program = await findSolanaMintProgram(token.mint);
  if (program !== "spl-token") {
    throw new Error(
      program === "spl-token-2022"
        ? `${label} (${token.ticker}) is a Token-2022 mint, which Agent Intent can't send yet.`
        : `${label} (${token.ticker}) isn't a mint of the SPL Token program on Solana mainnet.`,
    );
  }
  return { type: "spl-token", ticker: token.ticker, decimals: token.decimals, mint: token.mint };
}

async function resolveNetworkAsset(
  network: IntentNetwork,
  ticker: string,
  token: string | undefined,
  senderInput: SenderInput,
  out: Pick<CommandOutput, "withActivity">,
): Promise<NetworkAsset> {
  if (!token && nativeNetworkOf(ticker) === network) {
    return network === "ethereum"
      ? { network, asset: ethereumAsset() }
      : { network, asset: solanaAsset() };
  }
  const address =
    token ??
    (await resolveTokenByTicker(
      network,
      ticker,
      "account" in senderInput ? senderInput.account : undefined,
      out,
    ));
  const fromTokenFlag = token !== undefined;
  if (network === "ethereum") {
    return { network, asset: await resolveErc20(ticker, address, fromTokenFlag) };
  }
  return { network, asset: await resolveSplToken(ticker, address, fromTokenFlag) };
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
        "Solana mainnet). Without it, the --amount ticker picks the token the --account holds or " +
        "the only one CAL lists, on the sender's network, and fails if several match.",
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
    const ctx = { command: "agent-intent send", network: "" };
    const out = createCommandOutput(resolveOutputFormat(flags.output), ctx);
    await out.run(async () => {
      const parsedSender = parseSenderInput(
        { account: flags.account, address: flags.from },
        "from",
      );
      const senderInput: SenderInput =
        "account" in parsedSender
          ? { account: await resolveSenderAccount(parsedSender.account) }
          : parsedSender;
      const { amount: displayAmount, ticker } = parseAmountWithTicker(flags.amount);
      const network = networkOf(ticker, flags.token, senderInput);
      ctx.network = network;
      assertNetworkFlags(network, flags);
      const profile = requireEnrolledProfile(await Session.read(), flags.profile);
      const { sender, recipient, senderField } = resolveParties(network, senderInput, flags.to);
      const networkAsset = await resolveNetworkAsset(
        network,
        ticker,
        flags.token,
        senderInput,
        out,
      );
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
