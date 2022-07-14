import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { getAccountCurrency } from "../../account";
import type { Transaction } from "../../generated/types";
import { modes } from "./modules";
import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/types-live";

function hexAsBuffer(hex) {
  if (!hex) return;
  return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
}

const options = [
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
    multiple: true,
  },
  {
    name: "collection",
    type: String,
    desc: "determine the collection of an NFT (related to the --tokenId)",
  },
  {
    name: "tokenId",
    type: String,
    desc: "determine the tokenId of an NFT (related to the --colection)",
  },
  {
    name: "gasPrice",
    type: String,
    desc: "how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)",
  },
  {
    name: "mode",
    alias: "m",
    type: String,
    desc:
      "action to do (possible modes: " + Object.keys(modes).join(" | ") + ")",
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient",
  },
  {
    name: "nonce",
    type: String,
    desc: "set a nonce for this transaction",
  },
  {
    name: "data",
    type: String,
    desc: "set the transaction data to use for signing the ETH transaction",
  },
];

function inferAccounts(
  account: Account,
  opts: Record<string, any>
): AccountLikeArray {
  invariant(account.currency.family === "ethereum", "ethereum family");

  if (!opts.token) {
    const accounts: Account[] = [account];
    return accounts;
  }

  return opts.token.map((token) => {
    const subAccounts = account.subAccounts || [];

    if (token) {
      const tkn = token.toLowerCase();
      const subAccount = subAccounts.find((t) => {
        const currency = getAccountCurrency(t);
        return tkn === currency.ticker.toLowerCase() || tkn === currency.id;
      });

      if (!subAccount) {
        throw new Error(
          "token account '" +
            token +
            "' not found. Available: " +
            subAccounts.map((t) => getAccountCurrency(t).ticker).join(", ")
        );
      }

      return subAccount;
    }
  });
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account, mainAccount }) => {
    invariant(transaction.family === "ethereum", "ethereum family");
    let subAccountId;

    if (account.type === "TokenAccount") {
      subAccountId = account.id;
    }

    return {
      ...transaction,
      family: "ethereum",
      subAccountId,
      gasPrice: opts.gasPrice ? inferAmount(mainAccount, opts.gasPrice) : null,
      userGasLimit: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      estimatedGasLimit: null,
      mode: opts.mode || "send",
      nonce: opts.nonce ? parseInt(opts.nonce) : undefined,
      data: opts.data ? hexAsBuffer(opts.data) : undefined,
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
