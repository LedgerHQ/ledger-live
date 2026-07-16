import shuffle from "lodash/shuffle";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { parseCurrencyUnit } from "@ledgerhq/live-currency-format";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

const inferAmount = (account: AccountLike, str: string): BigNumber => {
  const currency = getAccountCurrency(account);
  const { units } = currency;

  if (str.endsWith("%")) {
    return account.balance.times(0.01 * parseFloat(str.replace("%", "")));
  }

  const lowerCase = str.toLowerCase();

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const code = unit.code.toLowerCase();

    if (lowerCase.includes(code)) {
      return parseCurrencyUnit(unit, lowerCase.replace(code, ""));
    }
  }

  return parseCurrencyUnit(units[0], str);
};

export type InferTransactionsOpts = Partial<{
  "self-transaction": boolean;
  "use-all-amount": boolean;
  recipient: string[];
  amount: string;
  shuffle: boolean;
  collection: string;
  tokenIds: string;
  quantities: string;
}>;
export const inferTransactionsOpts = [
  {
    name: "self-transaction",
    type: Boolean,
    desc: "Pre-fill the transaction for the account to send to itself",
  },
  {
    name: "use-all-amount",
    type: Boolean,
    desc: "Send MAX of the account balance",
  },
  {
    name: "recipient",
    type: String,
    desc: "the address to send funds to",
    multiple: true,
  },
  {
    name: "amount",
    type: String,
    desc: "how much to send in the main currency unit",
  },
  {
    name: "shuffle",
    type: Boolean,
    desc: "if using multiple token or recipient, order will be randomized",
  },
  {
    name: "collection",
    type: String,
    desc: "collection of an NFT (in corelation with --tokenIds)",
  },
  {
    name: "tokenIds",
    type: String,
    desc: "tokenId or list of tokenIds of an NFT separated by commas (order is kept in corelation with --quantities)",
  },
  {
    name: "quantities",
    type: String,
    desc: "quantity or list of quantity of an ERC1155 NFT separated by commas (order is kept in corelation with --tokenIds)",
  },
];

export async function inferTransactions(
  mainAccount: Account,
  opts: InferTransactionsOpts,
): Promise<[Transaction, TransactionStatusCommon][]> {
  const bridge = await getAccountBridge(mainAccount, null);

  const recipients = opts.recipient || [opts["self-transaction"] ? mainAccount.freshAddress : ""];

  let transactionsToPrepare: Transaction[] = recipients.map((recipient: string) => {
    const transaction = bridge.createTransaction(mainAccount);
    transaction.recipient = recipient;
    transaction.useAllAmount = !!opts["use-all-amount"];
    transaction.amount = transaction.useAllAmount
      ? new BigNumber(0)
      : inferAmount(mainAccount, opts.amount || "0");

    // NFT collection and tokenId go by pair
    if (opts.tokenIds && opts.collection) {
      transaction.tokenIds = opts.tokenIds.split(",");
      transaction.collection = opts.collection;
      transaction.quantities = opts.quantities?.split(",")?.map(q => new BigNumber(q));
    }

    return transaction;
  });

  if (opts.shuffle) {
    transactionsToPrepare = shuffle(transactionsToPrepare);
  }

  const transactions: [Transaction, TransactionStatusCommon][] = await Promise.all(
    transactionsToPrepare.map(async transaction => {
      const tx = await bridge.prepareTransaction(mainAccount, transaction);
      const status = await bridge.getTransactionStatus(mainAccount, tx);
      const errorKeys = Object.keys(status.errors);

      if (errorKeys.length) {
        throw status.errors[errorKeys[0]];
      }

      return [tx, status];
    }),
  );

  return transactions;
}
