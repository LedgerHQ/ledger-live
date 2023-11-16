import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";
import { Transaction as VechainTransaction } from "./types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { VTHO_ADDRESS } from "./contracts/constants";
import VIP180 from "./contracts/abis/VIP180";
import { MustBeVechain } from "./errors";

type Clauses = {
  to: string;
  data: string;
  value: string | number;
};

const options = [
  {
    name: "vechainCurrency",
    type: String,
    desc: 'select between sending VET or VTHO using "VET" or "VTHO" strings',
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    let subAccountId =
      account.type == "Account" && account.subAccounts ? account.subAccounts[0].id : "";

    if (account.type === "TokenAccount") {
      subAccountId = account.id;
    }

    const clauses: Array<Clauses> = [];

    if (opts.vechainCurrency == "VET") {
      clauses.push({
        to: transaction.recipient,
        value: "0x" + transaction.amount.toString(16),
        data: "0x",
      });
    } else if (opts.vechainCurrency == "VTHO") {
      clauses.push({
        value: 0,
        to: VTHO_ADDRESS,
        data: VIP180.transfer.encode(transaction.recipient, transaction.amount.toFixed()),
      });
    } else {
      throw new MustBeVechain();
    }

    return {
      ...transaction,
      family: "vechain",
      subAccountId: opts.vechainCurrency == "VTHO" ? subAccountId : "",
      body: { ...(transaction as VechainTransaction).body, clauses },
    } as VechainTransaction;
  });
}

export default {
  options,
  inferTransactions,
};
