// @flow
// handle erc20 feature others than send.

import abi from "ethereumjs-abi";
import invariant from "invariant";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import type { ModeModule } from "../types";
import { AmountRequired } from "@ledgerhq/errors";
import { validateRecipient } from "../customAddressValidation";
import { inferTokenAccount } from "../transaction";
import { getAccountCurrency } from "../../../account";
import { contractField } from "./compound";

export type Modes = "erc20.approve";

/**
 * "erc20.approve" allows a "spender" (e.g. contract address) to consume some erc20 tokens.
 * transaction params:
 * - transaction.recipient address of the spender
 * - transaction.amount in the token unit to allow
 * - transaction.useAllAmount intend to allow infinite amount (setting a very high value)
 */
const erc20approve: ModeModule = {
  fillTransactionStatus(a, t, result) {
    validateRecipient(a.currency, t.recipient, result);
    if (!t.useAllAmount && t.amount.eq(0)) {
      result.errors.amount = new AmountRequired();
    }
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);
    invariant(subAccount, "sub account missing");
    const recipient = eip55.encode(t.recipient);
    let amount;
    if (t.useAllAmount) {
      amount = BigNumber(2).pow(256).minus(1);
    } else {
      invariant(t.amount, "amount missing");
      amount = BigNumber(t.amount);
    }
    const data = abi.simpleEncode(
      "approve(address,uint256)",
      recipient,
      amount.toString(10)
    );
    tx.data = "0x" + data.toString("hex");
    tx.to = subAccount.token.contractAddress;
    tx.value = "0x00";
    return {
      erc20contracts: [recipient],
    };
  },

  fillDeviceTransactionConfig({ transaction, account }, fields) {
    fields.push({
      type: "text",
      label: "Type",
      value: "Approve",
    });
    if (transaction.useAllAmount) {
      fields.push({
        type: "text",
        label: "Amount",
        value: "Unlimited " + getAccountCurrency(account).ticker,
      });
    } else {
      // TODO amount should be just text in future
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }

    fields.push(contractField(transaction));
  },

  fillOptimisticOperation(_account, _transaction, operation) {
    operation.extra = {
      ...operation.extra,
      approving: true, // workaround to track the status ENABLING
    };
  },
};

export const modes: { [_: Modes]: ModeModule } = {
  "erc20.approve": erc20approve,
};
