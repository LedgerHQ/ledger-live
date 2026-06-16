import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getErc20ApproveData } from "./logic/getErc20Data";
import { Transaction } from "./types";

const modes = ["send", "revokeApproval", "approve"] as const;
type Mode = (typeof modes)[number];

function normalizeOptToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return undefined;
}

const options = [
  {
    name: "mode",
    type: String,
    desc: `Transaction mode: ${modes.join(", ")}. revokeApproval sets allowance to 0; approve sets a token allowance for a spender.`,
  },
  {
    name: "spender",
    type: String,
    desc: "Spender address (required for revokeApproval and approve).",
  },
  {
    name: "approveAmount",
    type: String,
    desc: "Amount to approve in token units, e.g. 1000, 0.5 or unlimited (required for mode approve).",
  },
];

const UNLIMITED_APPROVAL_AMOUNT = 2n ** 256n - 1n;

function inferMode(input?: string): Mode {
  const mode: Mode | undefined = input
    ? modes.includes(input as Mode)
      ? (input as Mode)
      : undefined
    : "send";

  if (mode === undefined) {
    throw new Error(`Unexpected mode <${input}>. Supported modes: ${modes.join(", ")}`);
  }

  return mode;
}

async function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    mainAccount: Account;
    transaction: Transaction;
  }>,
  opts: Partial<Record<string, string | string[]>>,
): Promise<Transaction[]> {
  const mode = inferMode(normalizeOptToString(opts.mode));

  if (mode === "send") {
    return transactions.map(({ transaction }) => transaction);
  }

  // revokeApproval | approve (CLI may pass --token/--spender/--approveAmount as string or array)
  const tokenId = normalizeOptToString(opts.token);
  const spender = normalizeOptToString(opts.spender);
  const approveAmountStr = normalizeOptToString(opts.approveAmount);

  if (!tokenId) {
    throw new Error(
      `--token <tokenId> is required for mode ${mode} (e.g. ethereum/erc20/usd__coin for USDC, ethereum/erc20/usd_tether__erc20_ for USDT)`,
    );
  }
  if (!spender) {
    throw new Error(`--spender <address> is required for mode ${mode}`);
  }

  const tokenCurrency = await getCryptoAssetsStore().findTokenById(tokenId);
  if (!tokenCurrency) {
    throw new Error(
      `Token <${tokenId}> not found. Use a token id (e.g. ethereum/erc20/usd__coin for USDC).`,
    );
  }
  if (tokenCurrency.parentCurrencyId !== transactions[0]?.mainAccount.currency.id) {
    throw new Error(
      `Token ${tokenId} is not on ${transactions[0]?.mainAccount.currency.id}. Use a token for the account's chain.`,
    );
  }

  const tokenContractAddress = tokenCurrency.contractAddress;
  let amountApproved: bigint;
  if (mode === "revokeApproval") {
    amountApproved = 0n;
  } else {
    if (!approveAmountStr || approveAmountStr.trim() === "") {
      throw new Error(
        "--approveAmount <amount> is required for mode approve (e.g. 1000, 0.5, or unlimited).",
      );
    }
    const trimmed = approveAmountStr.trim().toLowerCase();
    if (trimmed === "unlimited") {
      amountApproved = UNLIMITED_APPROVAL_AMOUNT;
    } else {
      const unit = tokenCurrency.units[0];
      const amountBn = parseCurrencyUnit(unit, trimmed);
      if (!amountBn.isInteger() || amountBn.isNegative()) {
        throw new Error(
          "approveAmount must be a non-negative number in token units (e.g. 1000 or 0.5), or 'unlimited'.",
        );
      }
      amountApproved = BigInt(amountBn.toFixed(0));
    }
  }

  const data = getErc20ApproveData(spender, amountApproved);

  return transactions.map(({ transaction }): Transaction => {
    invariant(transaction.family === "evm", "EVM family transaction expected");
    const { nft: _nft, ...rest } = transaction;
    return {
      ...rest,
      mode: "send" as const,
      recipient: tokenContractAddress,
      amount: new BigNumber(0),
      useAllAmount: false,
      data,
    };
  });
}

function inferAccounts(mainAccount: Account, opts: Record<string, unknown>): AccountLikeArray {
  invariant(mainAccount.currency.family === "evm", "EVM family currency");

  const mode = inferMode(normalizeOptToString(opts.mode));

  if (mode === "revokeApproval" || mode === "approve") {
    return [mainAccount];
  }

  // send: use token subAccount if --token provided
  const tokens: string[] | undefined = opts.token as string[] | undefined;
  if (tokens !== undefined && tokens.length > 0) {
    const token = Array.isArray(tokens) ? tokens[0] : tokens;
    const subAccount = mainAccount.subAccounts?.find(subAcc => {
      const currency = getAccountCurrency(subAcc);
      return token === currency.ticker || token === currency.id;
    });
    if (subAccount) {
      return [subAccount];
    }
  }

  return [mainAccount];
}

export default function makeCliTools(): {
  options: typeof options;
  inferAccounts: typeof inferAccounts;
  inferTransactions: typeof inferTransactions;
} {
  return {
    options,
    inferAccounts,
    inferTransactions,
  };
}
