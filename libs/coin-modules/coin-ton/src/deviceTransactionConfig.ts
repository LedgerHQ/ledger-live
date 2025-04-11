import { getAccountCurrency, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { toNano } from "@ton/core";
import { BigNumber } from "bignumber.js";
import { TOKEN_TRANSFER_MAX_FEE } from "./constants";
import type { Transaction, TransactionStatus } from "./types";

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  const tokenTransfer = Boolean(input.account && isTokenAccount(input.account));

  fields.push({
    type: "address",
    label: "To",
    address: input.transaction.recipient,
  });

  if (tokenTransfer) {
    fields.push({
      type: "text",
      label: "Jetton amount",
      value: formatCurrencyUnit(
        getAccountCurrency(input.account).units[0],
        input.transaction.amount,
        {
          showCode: true,
          disableRounding: true,
        },
      ),
    });
    fields.push({
      type: "text",
      label: "Amount",
      value: input.parentAccount
        ? formatCurrencyUnit(
            getAccountCurrency(input.parentAccount).units[0],
            BigNumber(toNano(TOKEN_TRANSFER_MAX_FEE).toString()),
            {
              showCode: true,
              disableRounding: true,
            },
          )
        : TOKEN_TRANSFER_MAX_FEE,
    });
  } else {
    if (input.transaction.useAllAmount) {
      fields.push({
        type: "text",
        label: "Amount",
        value: "ALL YOUR TONs",
      });
    } else {
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  if (!input.transaction.comment.isEncrypted && input.transaction.comment.text) {
    fields.push({
      type: "text",
      label: "Comment",
      value: input.transaction.comment.text,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
