// @flow

import "lodash.product";
import { product } from "lodash";
import shuffle from "lodash/shuffle";
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  AccountLike,
  Account,
  AccountBridge
} from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { parseCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

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

export type InferTransactionsOpts = $Shape<{
  "self-transaction": boolean,
  "use-all-amount": boolean,
  recipient: string[],
  amount: string,
  feePerByte: string,
  gasPrice: string,
  gasLimit: string,
  token: string[],
  shuffle: boolean,
  tag: number,
  fee: BigNumber
}>;

// TODO split code per family so it works generically

export const inferTransactionsOpts = [
  {
    name: "self-transaction",
    type: Boolean,
    desc: "Pre-fill the transaction for the account to send to itself"
  },
  {
    name: "use-all-amount",
    type: Boolean,
    desc: "Send MAX of the account balance"
  },
  {
    name: "recipient",
    type: String,
    desc: "the address to send funds to",
    multiple: true
  },
  {
    name: "amount",
    type: String,
    desc: "how much to send in the main currency unit"
  },
  {
    name: "feePerByte",
    type: String,
    desc: "how much fee per byte"
  },
  {
    name: "fee",
    type: String,
    desc: "how much fee"
  },
  {
    name: "fees",
    type: String,
    desc: "how much fees"
  },
  {
    name: "tag",
    type: Number,
    desc: "ripple tag"
  },
  {
    name: "gasPrice",
    type: String,
    desc:
      "how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)"
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient"
  },
  {
    name: "storageLimit",
    type: String,
    desc: "how much storageLimit. default is estimated with the recipient"
  },
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
    multiple: true
  },
  {
    name: "subAccount",
    type: String,
    desc: "use a sub account instead of the parent by index"
  },
  {
    name: "mode",
    type: String,
    desc: "mode of transaction"
  },
  {
    name: "shuffle",
    type: Boolean,
    desc: "if using multiple token or recipient, order will be randomized"
  }
];
export function inferTransactions(
  account: Account,
  opts: InferTransactionsOpts
): Promise<Transaction[]> {
  const bridge = getAccountBridge(account, null);
  let pairs = product(opts.token || [null], opts.recipient || [null]);

  if (opts.shuffle) {
    pairs = shuffle(pairs);
  }

  return Promise.all(
    pairs.map(async ([token, recipient]) => {
      const transaction = await inferTransaction(token, recipient, bridge);
      const prepared = await bridge.prepareTransaction(account, transaction);
      return prepared;
    })
  );

  async function inferTransaction(
    token: ?string,
    recipientArg: ?string,
    bridge: AccountBridge<any>
  ): Promise<Transaction> {
    const recipient =
      (opts["self-transaction"] ? account.freshAddress : recipientArg) || "";

    const useAllAmount = !!opts["use-all-amount"];

    let acc;
    let subAccountId;
    const subAccounts = account.subAccounts || [];
    if (token) {
      const tkn = token.toLowerCase();
      const subAccount = subAccounts.find(
        t => tkn === t.token.ticker.toLowerCase() || tkn === t.token.id
      );
      if (!subAccount) {
        throw new Error(
          "token account '" +
            token +
            "' not found. Available: " +
            subAccounts.map(t => t.token.ticker).join(", ")
        );
      }
      acc = subAccount;
      subAccountId = subAccount.id;
    } else if (opts.subAccount) {
      const subAccount = subAccounts[opts.subAccount];
      if (!subAccount) {
        throw new Error("no sub account at index " + opts.subAccount);
      }
      acc = subAccount;
      subAccountId = subAccount.id;
    } else {
      acc = account;
    }

    const amount = useAllAmount
      ? BigNumber(0)
      : inferAmount(acc, opts.amount || "0.001");

    if (!amount) throw new Error("amount is required");

    switch (account.currency.family) {
      case "bitcoin": {
        const feePerByte = new BigNumber(
          opts.feePerByte === undefined ? 1 : opts.feePerByte
        );
        return {
          family: "bitcoin",
          recipient,
          amount,
          subAccountId,
          feePerByte,
          networkInfo: null,
          useAllAmount
        };
      }

      case "ethereum": {
        return {
          family: "ethereum",
          recipient,
          amount,
          subAccountId,
          gasPrice: inferAmount(account, opts.gasPrice || "2gwei"),
          userGasLimit: new BigNumber(opts.gasLimit),
          estimatedGasLimit: null,
          feeCustomUnit: null,
          networkInfo: null,
          useAllAmount
        };
      }

      case "ripple": {
        return {
          family: "ripple",
          recipient,
          amount,
          fee: inferAmount(account, opts.fee || "0.001xrp"),
          tag: opts.tag,
          feeCustomUnit: null,
          networkInfo: null,
          useAllAmount
        };
      }

      case "tezos": {
        return {
          ...bridge.createTransaction(account),
          family: "tezos",
          mode: opts.mode || "send",
          subAccountId,
          fees: opts.fees ? inferAmount(account, opts.fees) : null,
          gasLimit: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
          storageLimit: opts.storageLimit
            ? new BigNumber(opts.storageLimit)
            : null,
          recipient,
          amount,
          useAllAmount
        };
      }

      case "tron": {
        return {
          family: "tron",
          recipient,
          amount,
          // token: token || "TRX",
          useAllAmount
        };
      }

      default:
        throw new Error("family " + account.currency.family + " not supported");
    }
  }
}
