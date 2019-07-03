// @flow

import "lodash.product";
import { product } from "lodash";
import shuffle from "lodash/shuffle";
import { BigNumber } from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { parseCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { apiForCurrency } from "@ledgerhq/live-common/lib/api/Ethereum";

const inferAmount = (account, str) => {
  const currency = getAccountCurrency(account);
  const { units } = currency;
  if (str.endsWith("%")) {
    return account.balance.times(0.01 * parseFloat(str.replace("%", ""), 10));
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
  { name: "feePerByte", type: String, desc: "how much fee per byte" },
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
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
    multiple: true
  },
  {
    name: "shuffle",
    type: Boolean,
    desc: "if using multiple token or recipient, order will be randomized"
  }
];
export function inferTransactions(account, opts) {
  let pairs = product(opts.token || [null], opts.recipient || [null]);

  if (opts.shuffle) {
    pairs = shuffle(pairs);
  }

  return Promise.all(
    pairs.map(async ([token, recipient]) => {
      const tShared = {};

      let acc;
      if (token) {
        const tkn = token.toLowerCase();
        const tokenAccounts = account.tokenAccounts || [];
        const tokenAccount = tokenAccounts.find(
          t => tkn === t.token.ticker.toLowerCase() || tkn === t.token.id
        );
        if (!tokenAccount) {
          throw new Error(
            "token account '" +
              token +
              "' not found. Available: " +
              tokenAccounts.map(t => t.token.ticker).join(", ")
          );
        }
        acc = tokenAccount;
        tShared.tokenAccountId = tokenAccount.id;
      } else {
        acc = account;
      }

      switch (account.currency.family) {
        case "bitcoin":
          tShared.feePerByte = new BigNumber(
            opts.feePerByte === undefined ? 1 : opts.feePerByte
          );

        case "ethereum": {
          tShared.gasPrice = inferAmount(account, opts.gasPrice || "2gwei");
          if (opts.gasLimit) {
            tShared.gasLimit = new BigNumber(opts.gasLimit);
          }
          if (!tShared.gasLimit) {
            tShared.gasLimit = BigNumber(
              await apiForCurrency(account.currency).estimateGasLimitForERC20(
                acc.type === "TokenAccount"
                  ? acc.token.contractAddress
                  : recipient
              )
            );
          }
        }
      }

      if (opts["use-all-amount"]) {
        tShared.useAllAmount = true;
      }

      if (opts["self-transaction"]) {
        return {
          transaction: {
            amount: opts.amount
              ? inferAmount(acc, opts.amount)
              : inferAmount(acc, "0.001"),
            recipient: account.freshAddress,
            ...tShared
          }
        };
      }

      if (!opts.amount && !tShared.useAllAmount)
        throw new Error("amount is required");
      if (!recipient) throw new Error("recipient is required");
      return {
        transaction: {
          amount: tShared.useAllAmount
            ? BigNumber(0)
            : inferAmount(acc, opts.amount),
          recipient,
          ...tShared
        }
      };
    })
  );
}
