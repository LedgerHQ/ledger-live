// @flow

import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { apiForCurrency } from "@ledgerhq/live-common/lib/api/Ethereum";

export const inferTransactionOpts = [
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
    desc: "the address to send funds to"
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
    desc: "how much gasPrice in WEI unit! default is 1000000000"
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
    desc: "use an token account children of the account"
  }
];
export async function inferTransaction(account, opts) {
  const tShared =
    account.currency.family === "bitcoin"
      ? {
          feePerByte: new BigNumber(
            opts.feePerByte === undefined ? 1 : opts.feePerByte
          )
        }
      : account.currency.family === "ethereum"
      ? {
          gasPrice: new BigNumber(
            opts.gasPrice === undefined ? 1000000000 : opts.gasPrice
          ),
          gasLimit: new BigNumber(
            opts.gasLimit === undefined ? 0 : opts.gasLimit
          )
        }
      : null;

  let res;

  if (opts["use-all-amount"]) {
    tShared.useAllAmount = true;
  }

  if (opts["self-transaction"]) {
    res = {
      transaction: {
        amount: opts.amount
          ? parseCurrencyUnit(account.unit, opts.amount)
          : parseCurrencyUnit(account.unit, "0.001"),
        recipient: account.freshAddress,
        ...tShared
      }
    };
  } else {
    if (!opts.amount && !tShared.useAllAmount)
      throw new Error("amount is required");
    if (!opts.recipient) throw new Error("recipient is required");
    res = {
      transaction: {
        amount: tShared.useAllAmount
          ? BigNumber(0)
          : parseCurrencyUnit(account.unit, opts.amount),
        recipient: opts.recipient,
        ...tShared
      }
    };
  }

  if (opts.token) {
    const tkn = opts.token.toLowerCase();
    const tokenAccounts = account.tokenAccounts || [];
    res.tokenAccount = tokenAccounts.find(
      t => tkn === t.token.ticker.toLowerCase() || tkn === t.token.id
    );
    if (!res.tokenAccount) {
      throw new Error(
        "token account '" +
          opts.token +
          "' not found. Available: " +
          tokenAccounts.map(t => t.token.ticket).join(", ")
      );
    }
  }

  if ("gasLimit" in res.transaction) {
    res.transaction.gasLimit = await apiForCurrency(
      account.currency
    ).estimateGasLimitForERC20(res.transaction.recipient);
  }

  return res;
}
