import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createNonce, encodeSendIntentTlv } from "@ledgerhq/agent-intent-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Session } from "../../session/session-store";
import { requireEnrolledProfile } from "../../agent-intent/enrolled-profile";
import { resolveOutputFormat } from "../inputs";
import { parseAmountWithTicker, parseDecimalAmount, parseEvmAddress } from "../../agent-intent/evm";
import {
  FEE_STRATEGIES,
  toSdkSendIntent,
  type IntentAsset,
  type SendIntentSummary,
} from "../../agent-intent/send-intent";
import { findEthereumToken } from "../../agent-intent/token-lookup";
import { resolveSenderFromAccount } from "../../agent-intent/sender";
import {
  assertSdkAcceptsIntent,
  proposalOptions,
  submitAgentIntent,
  warnIfReviewLinkUnusable,
} from "../../agent-intent/propose-intent";
import { createCommandOutput } from "../../output";

function parseSenderInput(flags: {
  account?: string;
  from?: string;
}): { account: string } | { from: string } {
  if (flags.account && !flags.from) return { account: flags.account };
  if (flags.from && !flags.account) return { from: flags.from };
  throw new Error("Pass exactly one sender: --account <session-label> or --from <address>.");
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

export default defineCommand({
  name: "send",
  description:
    "Propose an Ethereum send (ETH or ERC-20) for human review in the Agent Intent frontend. " +
    "Never signs or broadcasts a transaction, and needs no device.",
  options: {
    ...proposalOptions,
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
    "dry-run": option(z.boolean().default(false), {
      description:
        "Validate and print the intent without submitting it (no keychain access, no sign-in).",
      argumentKind: "flag",
    }),
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
          : await resolveSenderFromAccount(senderInput.account, "send");
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
      assertSdkAcceptsIntent(() => encodeSendIntentTlv(intent, createNonce()));

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
